from docx import Document

files = ['file1.docx', 'file2.docx']

def combine_word_documents(target, source):
    merged_document = Document(target)
    sub_doc = Document(source)
    for element in sub_doc.element.body:
        merged_document.element.body.append(element)

    merged_document.save('merged.docx')

combine_word_documents("source.docx","source.docx")