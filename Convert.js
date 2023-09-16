var scriptFilePath = $.fileName; // .js位置
var scriptFolder = new File(scriptFilePath).parent.fsName; // .js文件夹
//var pythonPath = scriptFolder + "\\py3.9\\Scripts\\python.exe";
//var scriptPath = scriptFolder + "\\OpenCC_script.py";
var scriptPath = scriptFolder + "\\OpenCC_script.exe"
// get psd files
var inputFolder = Folder.selectDialog("选择包含PSD文件的文件夹");
var fileList = inputFolder.getFiles("*.psd");

// log file
var logFile = new File(inputFolder + "/log.txt");
logFile.encoding = 'utf-8';
logFile.open("w");

for (var i = 0; i < fileList.length; i++) {
    try {
        var doc = open(fileList[i]);
        processLayers(doc.layers);
        doc.save();
        doc.close();
    } catch (e) {
        logFile.writeln("Error while opening file " + fileList[i].name + ": " + e);
    }
}


function processLayers(layers) {
    for (var j = 0; j < layers.length; j++) {
        try {
            if (layers[j].typename == "ArtLayer" && layers[j].kind == LayerKind.TEXT) {
                var textItem = layers[j].textItem;
                var originalText = textItem.contents;

                // 获取文本样式范围信息
                var s2t = stringIDToTypeID;
                (r = new ActionReference()).putProperty(s2t('property'), p = s2t('textKey'));
                r.putIdentifier(stringIDToTypeID("layer"), layers[j].id);

                var item = executeActionGet(r).getObjectValue(p);
                var textStyleRangeList = item.getList(stringIDToTypeID("textStyleRange"));

                var textRanges = [];
                for (var i = 0; i < textStyleRangeList.count; i++) {
                    // 获取当前文本样式范围的ActionDescriptor对象
                    var rangeDesc = textStyleRangeList.getObjectValue(i);
                    textRanges.push({
                        from: rangeDesc.getInteger(s2t("from")),
                        to: rangeDesc.getInteger(s2t("to")),
                        textStyle: rangeDesc.getObjectValue(s2t("textStyle"))
                    });
                }

                // 繁转简
                var convertedText = convertText(originalText);
                // var visibleText = convertedText.replace(/\n/g, '\\n');  // 检查换行符

                // 设置字符属性
                // 更新文本图层的ActionDescriptor对象
                item.putList(s2t("textStyleRange"), textStyleRangeList);
                item.putString(s2t("textKey"), convertedText.replace(/\n/g, '\r'));
                (r = new ActionReference()).putIdentifier(s2t('layer'), layers[j].id);
                (d = new ActionDescriptor()).putReference(s2t('target'), r);
                d.putObject(s2t('to'), s2t('textLayer'), item);

                // 应用新的文本样式范围信息
                executeAction(s2t("set"), d, DialogModes.NO);
                
            } else if (layers[j].typename == "LayerSet") {
                processLayers(layers[j].layers);
            }
        } catch (e) {
            logFile.writeln("Error while processing layer: " + e);
        }
    }
}

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
    //var command = pythonPath + ' "' + scriptPath + '" "' + inputFilePath + '" "' + outputFilePath + '" "' + logFilePath + '"';
    var command = scriptPath + ' "' + inputFilePath + '" "' + outputFilePath + '" "' + logFilePath + '"';
    logFile.writeln("Running command: " + command);
    // logFile.writeln(Folder.current.fsName);
    var callback = system(command);
    if (callback != 0)
        logFile.writeln("Faild to run python command, callback: " + callback);

    // 读取输出文件
    var outputFile = new File(outputFilePath);
    outputFile.open("r");
    var result = outputFile.read();
    outputFile.close();

    return result;
}



// close log file
logFile.close();

