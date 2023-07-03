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

5. 保存文本属性

   最开始采用的存储`characterStyle`, `paragraphStyle`和`warpStyle`的方法。但是这个方法是针对整个文本框的，如果对某些文本做过特殊处理的话，这些特殊设置没法保存。

   既然PS支持对文本内的某段字词做单独处理，一定存在方法能够解决这一问题。

   去论坛找了找其他人的经验，参考[这个话题](https://community.adobe.com/t5/photoshop-ecosystem-discussions/change-color-of-a-single-word-in-a-text-layer-and-turn-symbols-to-superscript-using-javascript/m-p/13296042#M680787)得到了解决办法。不过，如果因为缺字导致PS应用了默认字符，也会被认为是特殊处理，在使用后还需要检查。
