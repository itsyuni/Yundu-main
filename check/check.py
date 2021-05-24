from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.models import load_model
import numpy as np
import argparse
import imutils
import pickle
import time
import cv2
import os
import sys
import math
def highlightFace(net, frame, conf_threshold=0.7):
    frameOpencvDnn=frame.copy()
    frameHeight=frameOpencvDnn.shape[0]
    frameWidth=frameOpencvDnn.shape[1]
    blob=cv2.dnn.blobFromImage(frameOpencvDnn, 1.0, (300, 300), [104, 117, 123], True, False)

    net.setInput(blob)
    detections=net.forward()
    faceBoxes=[]
    for i in range(detections.shape[2]):
        confidence=detections[0,0,i,2]
        if confidence>conf_threshold:
            x1=int(detections[0,0,i,3]*frameWidth)
            y1=int(detections[0,0,i,4]*frameHeight)
            x2=int(detections[0,0,i,5]*frameWidth)
            y2=int(detections[0,0,i,6]*frameHeight)
            faceBoxes.append([x1,y1,x2,y2])
    return frameOpencvDnn,faceBoxes
faceProto="check/opencv_face_detector.pbtxt"
faceModel="check/opencv_face_detector_uint8.pb"
ageProto="check/age_deploy.prototxt"
ageModel="check/age_net.caffemodel"
MODEL_MEAN_VALUES=(78.4263377603, 87.7689143744, 114.895847746)
ageList=['0-2', '4-6', '8-12', '15-20', '25-32', '38-43', '48-53', '60-100']

faceNet=cv2.dnn.readNet(faceModel,faceProto)
ageNet=cv2.dnn.readNet(ageModel,ageProto)
padding = 20

protoPath = os.path.sep.join(["check","face_detector", "deploy.prototxt"])
modelPath = os.path.sep.join(["check","face_detector",
	"res10_300x300_ssd_iter_140000.caffemodel"])
net = cv2.dnn.readNetFromCaffe(protoPath, modelPath)
model = load_model("check/liveness.model")
le = pickle.loads(open("check/le.pickle", "rb").read())
frame = cv2.imread(sys.argv[1])
(h, w) = frame.shape[:2]
blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0,
		(300, 300), (104.0, 177.0, 123.0))
net.setInput(blob)
detections = net.forward()
label = 0
counter = 0
for i in range(0, detections.shape[2]):
    confidence = detections[0, 0, i, 2]
    if confidence > 0.5:
        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
        (startX, startY, endX, endY) = box.astype("int")
        startX = max(0, startX)
        startY = max(0, startY)
        endX = min(w, endX)
        endY = min(h, endY)
        face = frame[startY:endY, startX:endX]
        face = cv2.resize(face, (32, 32))
        face = face.astype("float") / 255.0
        face = img_to_array(face)
        face = np.expand_dims(face, axis=0)
        preds = model.predict(face)[0]
        j = np.argmax(preds)
        label = le.classes_[j]
        label = "{}".format(label, preds[j])
if label == 'real':
    resultImg,faceBoxes=highlightFace(faceNet,frame)
    if not faceBoxes:
        print('face1')
    elif len(faceBoxes) > 1:
        print('face2')
    else:
        for faceBox in faceBoxes:
            face=frame[max(0,faceBox[1]-padding):
                        min(faceBox[3]+padding,frame.shape[0]-1),max(0,faceBox[0]-padding)
                        :min(faceBox[2]+padding, frame.shape[1]-1)]

            blob=cv2.dnn.blobFromImage(face, 1.0, (227,227), MODEL_MEAN_VALUES, swapRB=False)

            ageNet.setInput(blob)
            agePreds=ageNet.forward()
            age=ageList[agePreds[0].argmax()]
            if age == '8-12' or age == '15-20':
                print('good')
            else:
                print('bad')
else:
    print('fake')
sys.stdout.flush()
cv2.destroyAllWindows()
