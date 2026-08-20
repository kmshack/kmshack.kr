---
layout: post
title: Android에서 TensorFlow 실행하기
tags: 안드로이드
comments: true
---

Google은 기계 학습을 구현하기 위해 Android에서 사용할 수있는 TensorFlow라는 라이브러리를 오픈 소스로 제공합니다. TensorFlow는 Google에서 제공하는 Machine Intelligence 용 오픈 소스 소프트웨어 라이브러리입니다.  

인터넷을 많이 검색했지만 Android 용 TensorFlow를 만드는 간단한 방법이나 간단한 예제를 찾지 못했습니다. 알려진 정보를 토대로 잘 조합하여 빌드 할 수 있게 되었습니다. 이런 과정들을 다른사람들도 쉽게 이해 할 수 있도록 공유하기위해 글을 쓰게 되었습니다.  

이 글은 이미 기계 학습에 익숙하고 기계 학습을위한 모델 구축 방법을 알고있는 사람을 위해 작성된 글입니다. (예제에서는 사전 훈련 된 모델을 사용합니다). 기계 학습을 하기위한 벙법은 이미 많이 널려있으니 참고하시길 바랍니다.  

<br>
## Android용 TensorFlow 빌드하기  
<br>
**몇가지 알아두어야할 사항**

- TensorFlow의 핵심은 C++로 작성되었습니다.
- 안드로이드 용으로 빌드하려면 JNI(Java Native Interface)를 사용하여 loadModel, getPredictions 등과 같은 C++ 함수를 호출해야합니다.
- JAVA API를 호출하여 작업을 쉽게사용 하기위해 C++ 컴파일 된 파일 인 .so (공유 객체) 파일과 네이티브 C++을 호출 할 JAVA API로 구성된 jar 파일을 갖습니다.
- jar (자바 API)와 .so (C++ 컴파일 된) 파일이 필요합니다.
- 사전 훈련 된 모델 파일과 분류를 위한 라벨 파일이 필요합니다.  

개체를 탐지 할 수 있는 예제를 만들어 보겠습니다.  
먼저 jar와 .so 파일을 만들어 봅시다. TensorFlow를 JAVA기반의 안드로이드에서 작동 하기위해 so파일로 빌드하고 interface역할을 하기위해 jar이 필요합니다.

<br>
**필요한 툴**

- [Android SDK](https://developer.android.com/studio/index.html) 설치(Android Studio에 포함되어 있습니다.)
- [NDK](https://developer.android.com/ndk/downloads/older_releases.html#ndk-12b-downloads)를 설치합니다.
- [Bazel](https://bazel.build/versions/master/docs/install.html)을 설치합니다. (Bazel은 TensorFlow의 기본 구축 시스템입니다.)
- git clone –recurse-submodules [https://github.com/tensorflow/tensorflow.git](https://github.com/tensorflow/tensorflow.git)(참고 : `–recurse-submodules`명령을 통해 서브 모듈도 함께 내려받아야 합니다.)  

<br>
복제한 TensorFlow의 루트 디렉토리에서 WORKSPACE 파일을 찾아 편집합니다.

```
# Uncomment and update the paths in these entries to build the Android demo.
# android_sdk_repository(
# name = "androidsdk",
# api_level = 23,
# build_tools_version = "25.0.1",
# # Replace with path to Android SDK on your system
# path = "<PATH_TO_SDK>",
# )
#
# android_ndk_repository(
# name="androidndk",
# path="<PATH_TO_NDK>",
# api_level=14)
```

위에서 설치한 SDK, NDK경로를 지정합니다.

```
android_sdk_repository(
name = "androidsdk",
api_level = 23,
build_tools_version = "25.0.1",
# Replace with path to Android SDK on your system
path = "/Android/sdk/",
)
android_ndk_repository(
name="androidndk",
path="/android-ndk-r13/",
api_level=14)
```

.so 파일 빌드:

```
bazel build -c opt //tensorflow/contrib/android:libtensorflow_inference.so \
--crosstool_top=//external:android/crosstool \
--host_crosstool_top=@bazel_tools//tools/cpp:toolchain \
--cpu=armeabi-v7a
```

armeabi-v7a를 타겟으로 빌드를 합니다.  

빌드 후 아래 위치로 so파일이 생성됩니다.  
`bazel-bin/tensorflow/contrib/android/libtensorflow_inference.so`  

JAVA 빌드:
```
bazel build //tensorflow/contrib/android:android_tensorflow_inference_java
```

빌드후 아래 위치에 jar파일이 생성됩니다.  
`bazel-bin/tensorflow/contrib/android/libandroid_tensorflow_inference_java.jar`  

이제 jar와 .so 파일을 모두 가지고 있습니다. 이미 .so 파일과 jar 파일을 모두 빌드 했으므로 아래 프로젝트에서 직접 사용할 수 있습니다. 그러나 미리 훈련 된 모델과 레이블 파일이 필요합니다. 여기에서는 주어진 이미지에서 객체 감지를 수행하는 Google의 사전 훈련 된 모델을 사용합니다. ([모델 다운로드](https://storage.googleapis.com/download.tensorflow.org/models/inception5h.zip))  
다운받은 zip파일의 압축을 풀면 `imagenet_comp_graph_label_strings.txt` (객체의 레이블) 및 `tensorflow_inception_graph.pb` (사전 학습된 모델)가 생성됩니다.  

<br>
**1) Android Studio에서 Android 샘플 프로젝트를 만듭니다.**  
`imagenet_comp_graph_label_strings.txt` 및 `tensorflow_inception_graph.pb`를 assets 폴더에 넣습니다.  
`libandroid_tensorflow_inference_java.jar`를 libs 폴더에 넣고 마우스 오른쪽 버튼을 클릭하여 라이브러리로 추가하십시오.  

**2) 위에서 빌드한 jar파일과 so파일을 추가 합니다.**  
`compile files('libs/libandroid_tensorflow_inference_java.jar’)`  
기본 디렉토리에 jniLibs 폴더를 만들고 `libtensorflow_inference.so`를 `jniLibs/armeabi-v7a/` 폴더에 넣습니다.  

**3) 이제 TensorFlow Java API를 호출 할 수 있습니다.**  
TensorFlow Java API는 TensorFlowInferenceface 클래스를 통해 필요한 모든 메소드를 제공합니다. TensorFlow Java API를 호출하여 모델경로를 지정하고, 예측을 얻기위해 이미지를 입력해보세요!  

<br>

아래 주소를 통해 설명된 완벽한 예제 소스를 볼 수 있습니다.  
[https://github.com/MindorksOpenSource/AndroidTensorFlowMachineLearningExample](https://github.com/MindorksOpenSource/AndroidTensorFlowMachineLearningExample)    

이와 별개로 Caffe를 안드로이드에서 작동하는 방법도 있습니다.  
[https://github.com/kmshack/TrafficLightsDetector-Android](https://github.com/kmshack/TrafficLightsDetector-Android)
