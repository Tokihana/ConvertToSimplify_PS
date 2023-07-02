#coding=utf-8
import sys
from opencc import OpenCC

cc = OpenCC('t2s')

input_file_path = sys.argv[1]
output_file_path = sys.argv[2]
log_file_path = sys.argv[3]

try:
    with open(log_file_path, 'a', encoding='utf-8') as f:
        f.write("Input: "+ input_file_path)
    # ��ȡ�����ļ�
    with open(input_file_path, 'r', encoding = "utf-8") as f:
        text = f.read()
        f.close()

    # ת���ı�����
    converted_text = cc.convert(text)

    # ��ת������ı�����д������ļ�
    with open(output_file_path, 'w', encoding = "utf-8") as f:
        f.write(converted_text)
        f.close()
except Exception as e:
    # ��������Ϣд����־�ļ�
    with open(log_file_path, 'a', encoding='utf-8') as f:
        f.write("Error while running Python script: " + str(e) + "\n")
