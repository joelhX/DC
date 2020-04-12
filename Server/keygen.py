import hashlib
import json
import zlib

with open ("configs.json") as f:
    configs=json.load(f)
    buf=json.dumps(configs,separators=(',',':'))
    configs["key"]=hashlib.sha1(buf.encode(encoding="utf8")).hexdigest()
    license=json.dumps(configs,separators=(',',':'))
    with open ("License.key", "wb") as f:
        f.write(zlib.compress(license.encode("utf8")))
    
