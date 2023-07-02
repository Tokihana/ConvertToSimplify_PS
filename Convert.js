var scriptFilePath = $.fileName; // .jsλ��
var scriptFolder = new File(scriptFilePath).parent.fsName; // .js�ļ���
var pythonPath = scriptFolder + "\\py3.9\\Scripts\\python.exe";
var scriptPath = scriptFolder + "\\OpenCC_script.py";
// get psd files
var inputFolder = Folder.selectDialog("ѡ�����PSD�ļ����ļ���");
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
                var convertedText = convertText(originalText);

                // �����ַ����Է�ʽ
                var characterStyle = textItem.characterStyle;
                var paragraphStyle = textItem.paragraphStyle;
                var warpStyle = textItem.warpStyle;
                var baseline = textItem.baseline;
                var tsume = textItem.tsume;

                textItem.contents = convertedText.replace(/\n/g, '\r'); // ��Ҫ�޸Ļ��з�����������
                // var visibleText = convertedText.replace(/\n/g, '\\n');  // ��黻�з�
                // logFile.writeln(visibleText)

                // �����ַ�����
                textItem.characterStyle = characterStyle;
                textItem.paragraphStyle = paragraphStyle;
                textItem.warpStyle = warpStyle;
                textItem.baseline = baseline;
                textItem.tsume = tsume;


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

    // ���ı�����д�������ļ�
    var inputFile = new File(inputFilePath);
    inputFile.encoding = 'utf-8';
    inputFile.open("w");
    inputFile.write(text);
    inputFile.close();

    // ���� Python �ű�
    var command = pythonPath + ' "' + scriptPath + '" "' + inputFilePath + '" "' + outputFilePath + '" "' + logFilePath + '"';
    logFile.writeln("Running command: " + command);
    // logFile.writeln(Folder.current.fsName);
    app.system(command);

    // ��ȡ����ļ�
    var outputFile = new File(outputFilePath);
    outputFile.open("r");
    var result = outputFile.read();
    outputFile.close();

    return result;
}



// close log file
logFile.close();

