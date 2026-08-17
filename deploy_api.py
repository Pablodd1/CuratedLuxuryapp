import hashlib, os, json, urllib.request, urllib.parse, urllib.error

ACCOUNT = "1c34c6d633a5ab5cf7c8b3f06770a67b"
TOKEN = "c06147b830114c728c4437a765c794476457b"
EMAIL = "jasmelacosta@gmail.com"
PROJ = "curatedlux"
DEPLOY_BASE = ("https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT +
               "/pages/projects/" + PROJ + "/deployments")


def cf(method, url, payload=None, raw=None, ctype="application/json", extra=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("X-Auth-Email", EMAIL)
    req.add_header("X-Auth-Key", TOKEN)
    for h, v in (extra or {}).items():
        req.add_header(h, v)
    if payload is not None:
        data = json.dumps(payload).encode()
        req.add_header("Content-Type", ctype)
    elif raw is not None:
        data = raw
        req.add_header("Content-Type", ctype)
    else:
        data = None
    try:
        with urllib.request.urlopen(req, data=data, timeout=90) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"_http_error": e.code, "_body": e.read().decode()[:800]}


# Build manifest: "/path" -> sha256 hex
manifest = {}
blobs = {}  # "/path" -> bytes
for root, _, files in os.walk("dist"):
    for f in files:
        p = os.path.join(root, f)
        rel = os.path.relpath(p, "dist")
        key = "/" + rel
        with open(p, "rb") as fh:
            data = fh.read()
        manifest[key] = hashlib.sha256(data).hexdigest()
        blobs[key] = data

print("Manifest files:", len(manifest))
for k in sorted(manifest):
    print("  ", k, manifest[k][:12])

# 1) Create deployment with manifest as MULTIPART FORM-DATA (required by Pages API)
boundary_man = "----HermesManifestBoundary"
manifest_json = json.dumps(manifest)
mf = (f"--{boundary_man}\r\n"
      f'Content-Disposition: form-data; name="manifest"\r\n\r\n'
      f"{manifest_json}\r\n"
      f"--{boundary_man}--\r\n").encode()
req = urllib.request.Request(DEPLOY_BASE, method="POST", data=mf)
req.add_header("Content-Type", f"multipart/form-data; boundary={boundary_man}")
req.add_header("X-Auth-Email", EMAIL)
req.add_header("X-Auth-Key", TOKEN)
try:
    with urllib.request.urlopen(req, timeout=90) as r:
        body = r.read().decode()
    resp = json.loads(body)
except urllib.error.HTTPError as e:
    resp = {"_http_error": e.code, "_body": e.read().decode()[:800]}
if "_http_error" in resp:
    print("CREATE ERROR", resp["_http_error"], resp["_body"])
    raise SystemExit(1)
result = resp.get("result", {})
dep_id = result.get("id")
jwt = result.get("jwt")
form = result.get("form")

upload_url = form if isinstance(form, str) else form.get("url", "") if isinstance(form, dict) else ""
if not upload_url:
    print("No upload URL found. result keys:", list(result.keys()))
    print(json.dumps(result, indent=2)[:1500])
    raise SystemExit(1)

print("\ndeployment_id:", dep_id)
print("upload_url:", upload_url)

# 2) Upload each file via multipart to the upload URL
# Pages direct upload: PUT {form}/upload/{key} OR payload manifest with the upload
# Actually the flow: the "form" is the cf-railgun-style target that accepts
# manifest uploads. The documented API: use the upload URL with multipart form
# field "file" for the deploy. We'll use POST multipart at the form URL.

boundary = "----HermesBoundary1234"
parts = []
for key in sorted(blobs):
    body = blobs[key]
    parts.append(
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="{key.lstrip("/")}"\r\n'
        f'Content-Type: application/octet-stream\r\n\r\n'
    )
    parts.append(body)
    parts.append(b"\r\n")
parts.append(f"--{boundary}--\r\n")

# The CF pages upload endpoint expects a single file per request (keyed), or
# a "manifest" presence. Standard approach from cf api examples:
#   curl -X POST {form} -F 'manifest={json}' -F 'key=@file'
# We'll mimic: POST multipart with `manifest` field (JSON) + each file.
# Do one request per file using the publish endpoint's upload token.
def upload_file(path_key, data_bytes):
    b = f"--{boundary}\r\n"
    b += 'Content-Disposition: form-data; name="manifest"\r\n\r\n'
    b += json.dumps({path_key: manifest[path_key]}) + "\r\n"
    b += f"--{boundary}\r\n"
    b += f'Content-Disposition: form-data; name="key"; filename="{path_key.lstrip("/")}"\r\n'
    b += "Content-Type: application/octet-stream\r\n\r\n"
    body = b.encode() + data_bytes + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(upload_url, method="POST", data=body)
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("X-Cf-Pages-Auth-Token", jwt) if jwt else None
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read().decode()[:300]
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.read().decode()[:300]}"

for key in sorted(blobs):
    print(f"uploading {key} ...", upload_file(key, blobs[key]))

# 3) The deployment is created+uploaded in one flow. Check status.
print("\n=== Check deployment status ===")
st = cf("GET", DEPLOY_BASE + "/" + dep_id)
r = st.get("result", {})
print("state:", r.get("stage"), "| short_id:", r.get("short_id"), "| url:", r.get("url"))