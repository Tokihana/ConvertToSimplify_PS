var scriptFilePath = $.fileName; // .js位置
var scriptFolder = new File(scriptFilePath).parent.fsName; // .js文件夹
var pythonPath = scriptFolder + "\\py3.9\\Scripts\\python.exe";
var scriptPath = scriptFolder + "\\OpenCC_script.py";
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

                // 存储字符属性
                var characterStyle = textItem.characterStyle;
                var paragraphStyle = textItem.paragraphStyle;
                var warpStyle = textItem.warpStyle;

                // 繁转简
                var convertedText = convertText(originalText);
                textItem.contents = convertedText.replace(/\n/g, '\r'); // 需要修改换行符，否则乱码
                // var visibleText = convertedText.replace(/\n/g, '\\n');  // 检查换行符
                // logFile.writeln(visibleText)

                // 设置字符属性
                textItem.characterStyle = characterStyle;
                textItem.paragraphStyle = paragraphStyle
                textItem.warpStyle = warpStyle;
                
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
    var command = pythonPath + ' "' + scriptPath + '" "' + inputFilePath + '" "' + outputFilePath + '" "' + logFilePath + '"';
    logFile.writeln("Running command: " + command);
    // logFile.writeln(Folder.current.fsName);
    app.system(command);

    // 读取输出文件
    var outputFile = new File(outputFilePath);
    outputFile.open("r");
    var result = outputFile.read();
    outputFile.close();

    return result;
}



// close log file
logFile.close();

