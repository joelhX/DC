import os
import zipfile
import shutil
import json

def CustomProperty(cursor, DocxFileName, documentid, componentid):
    query = 'Select docinfo, name from configuration where csciid=' + componentid + ';'
    cursor.execute(query)
    result=cursor.fetchone()
    property = json.loads(result[0])
    prop=dict()
    for i in property:
        prop[i[0]]=i[int(documentid)]

    with zipfile.ZipFile(DocxFileName, 'r') as zf:
        zf.extractall(DocxFileName+"_extract")
        zf.close()

    with open("./"+DocxFileName+"_extract/docProps/custom.xml", "r", encoding="utf8") as p:
        buf = p.read()

    with open("./"+DocxFileName+"_extract/docProps/custom.xml", "w", encoding="utf8") as p:
        for k, v in prop.items():
            buf = buf.replace(str("#"+k+"#"), str(v))
        p.write(buf)

    with zipfile.ZipFile(DocxFileName, 'w') as zf:
        for (path, dir, files) in os.walk(DocxFileName+"_extract"):
            for file in files:
                fullpath = os.path.join(path, file)
                relpath = os.path.relpath(fullpath, DocxFileName+"_extract")
                zf.write(fullpath, relpath, zipfile.ZIP_DEFLATED)
        zf.close()
    shutil.rmtree(DocxFileName+"_extract")
