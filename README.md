# Motivation

因为每次都忘记检查校对稿是不是简体，经常嵌到一半返工。所以写个脚本自动化改psd里面的繁体文本框。

不一定很好用，但聊胜于无。



# 逻辑

PS调用JS脚本，提取出文本框内的文本，调用Python脚本，使用opencc库转换。



## python脚本

逻辑类似以下交互式代码

```py
>>> from opencc import OpenCC
>>> cc = OpenCC('t2s')
>>> text = '經過片刻安穩的日子，一行人前往交涉的新地點是？！'
>>> converted_text = cc.convert(text)
>>> converted_text
'经过片刻安稳的日子，一行人前往交涉的新地点是？！'
```

> 注意，opencc的运行路径必须全英文，否则会报`OSError`



## JS脚本

1. 读取文件夹里的所有`*.psd`

   ```javascript
   var fileList = inputFolder.getFiles("*.psd");
   ```

   

2. 获取psd的图层

   ```javascript
   var doc = open(fileList[i])
   var layers = doc.layers
   ```

3. 因为图层是嵌套的，所以应当遍历所有的嵌套图层

   ```javascript
   function processLayers(layers) {
       for (var j = 0; j < layers.length; j++) {
           try {
               if (layers[j].typename == "ArtLayer" && layers[j].kind == LayerKind.TEXT) {
                   var textItem = layers[j].textItem;
                   var originalText = textItem.contents;
                   var convertedText = convertText(originalText);
                   textItem.contents = convertedText;
               } else if (layers[j].typename == "LayerSet") {
                   processLayers(layers[j].layers);
               }
           } catch (e) {
               logFile.writeln("Error while processing layer: " + e);
           }
       }
   }
   ```

4. Convert方法，调用py脚本。脚本之间用了个临时txt交互

   ```javascript
   function convertText(text) {
       var inputFilePath = inputFolder.fsName + "\\input.txt";
       var outputFilePath = inputFolder.fsName + "\\output.txt";
       var logFilePath = inputFolder.fsName + "\\log.txt";
   
       // 将文本内容写入输入文件
       var inputFile = new File(inputFilePath);
       inputFile.encoding = 'utf-8';
       inputFile.open("w");
       inputFile.write(text);
       inputFile.close();
   
       // 运行 Python 脚本
       var command = pythonPath + ' "' + scriptPath + '" "' + inputFilePath + '" "' + outputFilePath + '" "' + logFilePath + '"';
       logFile.writeln("Running command: " + command);
       // logFile.writeln(Folder.current.fsName); 这里检查了下运行路径，发现是PS的文件夹
       // 调用脚本所在的文件夹应该用：
       // var scriptFilePath = $.fileName; 
       // var scriptFolder = new File(scriptFilePath).parent; 
       app.system(command);
   
       // 读取输出文件
       var outputFile = new File(outputFilePath);
       outputFile.open("r");
       var result = outputFile.read();
       outputFile.close();
   
       return result;
   }
   ```



# Debug

调用脚本后，检查psd目录下：

1. output未正常生成。则调用python脚本出问题，检查文件路径
2. psd文本变成空。没有正确convert，可能是调用py脚本问题，也可能py脚本内opencc没有正确转换，需要检查编码。
3. `SyntaxError: Non-UTF-8 code starting with '\xe6' in file`，py代码写了中文注释，代码最开头要加`#coding=utf-8`

脚本和psd路径都不要有中文， 可能会有不可预想的bug。

代码运行后，需要检查是否有缺字，以及部分字符样式可能需要重设（已知有标准罗马对齐，比例间距等，换行符等）。这个是后面需要改进的问题。



# 2023/7/3 Fixed

1. 不能保留字符样式和段落样式

   解决但没完全解决，可以事先保存`characterStyle`, `paragraphStyle`, `warpStyle`，但单个字符上的设置似乎还是没法保存？（指基线偏移和字符间距，该不会因为这两个是中日文独有的？）

2. 字符转换会将换行转换为不可读样式。

   这个问题是因为换行符是`\r`，而不是`\n`，因此需要用.replace()`改过来。

3. 对于问题1中的不能完全保留字符样式和段落样式，是因为我会对对白中的某些字符样式做单独处理，这部分是需要单独划分出来并保存的。
