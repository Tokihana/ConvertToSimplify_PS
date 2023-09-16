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

                // ��ȡ�ı���ʽ��Χ��Ϣ
                var s2t = stringIDToTypeID;
                (r = new ActionReference()).putProperty(s2t('property'), p = s2t('textKey'));
                r.putIdentifier(stringIDToTypeID("layer"), layers[j].id);

                var item = executeActionGet(r).getObjectValue(p);
                var textStyleRangeList = item.getList(stringIDToTypeID("textStyleRange"));

                var textRanges = [];
                for (var i = 0; i < textStyleRangeList.count; i++) {
                    // ��ȡ��ǰ�ı���ʽ��Χ��ActionDescriptor����
                    var rangeDesc = textStyleRangeList.getObjectValue(i);
                    textRanges.push({
                        from: rangeDesc.getInteger(s2t("from")),
                        to: rangeDesc.getInteger(s2t("to")),
                        textStyle: rangeDesc.getObjectValue(s2t("textStyle"))
                    });
                }

                // ��ת��
                var convertedText = convertText(originalText);
                // var visibleText = convertedText.replace(/\n/g, '\\n');  // ��黻�з�

                // �����ַ�����
                // �����ı�ͼ���ActionDescriptor����
                item.putList(s2t("textStyleRange"), textStyleRangeList);
                item.putString(s2t("textKey"), convertedText.replace(/\n/g, '\r'));
                (r = new ActionReference()).putIdentifier(s2t('layer'), layers[j].id);
                (d = new ActionDescriptor()).putReference(s2t('target'), r);
                d.putObject(s2t('to'), s2t('textLayer'), item);

                // Ӧ���µ��ı���ʽ��Χ��Ϣ
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
    //app.system(command);
    system(command);

    // ��ȡ����ļ�
    var outputFile = new File(outputFilePath);
    outputFile.open("r");
    var result = outputFile.read();
    outputFile.close();

    return result;
}



// close log file
logFile.close();

