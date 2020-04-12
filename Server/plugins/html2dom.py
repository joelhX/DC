import json
from bs4 import BeautifulSoup

def searchDom(dom,contents):
    for div in dom.children:
        if(div.name == "div"):
            if(len(div)>0):
                searchDom(div,contents)
            else:
                contents.append(("P", div.attrs, div.text))    
        if(div.name == "p"):
            for img in div.children:
                if(img.name == "img"):
                    contents.append(("img", img.attrs))
            contents.append(("P", div.attrs, div.text))
        if(div.name == "table"):
            table = []
            for t in div.children:
                if (t.name in ["tbody", "thead"]):
                    for tt in t.children:
                        if(tt.name == "tr"):
                            row = []
                            for ttt in tt.children:
                                if(ttt.name in ["td", "th"]):
                                    row.append((ttt.text, ttt.attrs))
                                    #for tttt in ttt.children:
                                    #    if(tttt.name in ["div"]):
                                    #    row.append((tttt.text, tttt.attrs))
                            table.append(row)
            contents.append(("table",table,div.attrs))

def html2dom(html_doc):
    #print(html_doc)
    soup = BeautifulSoup(html_doc, 'html.parser')
    contents = []
    searchDom(soup,contents)
    return contents
        #with open("a.json","w")  as f:
        #    json.dump(contents,f)
