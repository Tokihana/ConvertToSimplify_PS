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
    # 读取输入文件
    with open(input_file_path, 'r', encoding = "utf-8") as f:
        text = f.read()
        f.close()

    # 转换文本内容
    converted_text = cc.convert(text)

    # 将转换后的文本内容写入输出文件
    with open(output_file_path, 'w', encoding = "utf-8") as f:
        f.write(converted_text)
        f.close()
except Exception as e:
    # 将错误信息写入日志文件
    with open(log_file_path, 'a', encoding='utf-8') as f:
        f.write("Error while running Python script: " + str(e) + "\n")
