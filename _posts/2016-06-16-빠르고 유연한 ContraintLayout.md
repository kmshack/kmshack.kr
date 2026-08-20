---
layout: post
last_modified_at: 2016-06-16
title: 빠르고 유연한 ConstraintLayout 살펴보기
tags: 안드로이드
legacy: true
---


### ConstraintLayout?
ConstraintLayout은 Google I/O 2016에서 발표된 Android 레이아웃이다. 깊고 복잡한 뷰 계층을 줄이면서 다양한 화면 크기에 대응할 수 있으며, Android Studio의 레이아웃 에디터와 함께 사용할 수 있다. 이 글에서는 초기 알파 버전을 기준으로 주요 제약 속성을 살펴본다.  

build.gradle에서 해당 라이브러리를 추가한다.
```
compile 'com.android.support.constraint:constraint-layout:1.0.0-alpha2'
```

<br>
### ConstraintLayout 속성
```
layout_constraintTop_toTopOf
layout_constraintTop_toBottomOf
layout_constraintBottom_toTopOf
layout_constraintBottom_toBottomOf
layout_constraintLeft_toTopOf
layout_constraintLeft_toBottomOf
layout_constraintLeft_toLeftOf
layout_constraintLeft_toRightOf
layout_constraintRight_toTopOf
layout_constraintRight_toBottomOf
layout_constraintRight_toLeftOf
layout_constraintRight_toRightOf
layout_constraintCenterX_toCenterX
layout_constraintCenterY_toCenterY
layout_constraintBaseline_toBaselineOf
```

속성을 보면 알겠지만 많은 속성들로 인해 복잡하고 뷰들 간의 관계에 대한 속성들이 대부분이다. 자식 뷰 사이의 관계를 연결해주는 것을 보면 RelativeLayout와 비슷해보이지만 ConstraintLayout은 자식들과 부모관의 관계에 대한 정렬및 배치 방식과 좌표가 아닌 비율을 통해 위치가 지정되는등 다양한 기능을 가졌다.  

<br>
### 레이아웃 에디터
개발자라면 그동안 레이아웃을 XML편집기를 이용하여 텍스트로 작성했을 것이다. 하지만 ConstraintLayout은 무수히 많은 속성과 타겟 뷰의 ID를 값으로 주는 만큼 레이아웃구조를 텍스트로 작성하거나 또는 읽을때 예전보다는 확연히 힘들것이다. 이렇게 복잡한 레이아웃을 텍스트가 아닌 새롭게 선보인 디자인 툴(Blue Print)을 이용하면 훨씬 쉽고 간단하게 작성할 수 있다.  

레이아웃 에디터는 UI설계를 하는 Design과 뷰 사이의 관계를 보여주는 BluePrint 화면 2개가 나타난다. 이 2개 화면을 동시에 보거나 따로보는 방법은 레이아웃 에디터의 상단 아이콘을 이용하면 전환할 수 있다.  
- Design: 한번 누르면 디자인 화면으로 전환 되며 또한번 누르면 BluePrint 화면을 동시에 2개가 나타난다.
- BluePrint: 한번 누르면 BluePrint화면으로 전환되며 또한번 누르면 디자인 화면과 동시에 2개가 나타난다.

<br>
### 레이아웃 편집시 쓰이는 아이콘

BluePrint화면의 뷰들간의 관계에 대한 정보를 숨기고 보일 수 있다.  
새로운 뷰를 드래그 하는 경우 다른 뷰들간의 관계를 자동으로 연결할 수 있다.  
관계를 정보를 모두 삭제 한다.  
자동으로 관계에 대한 정보를 연결한다.  
마진값의 단위를 선택한다. 0, 8, 16dp로 전환이 가능하다.  

<br>
### 레이아웃 내에서 쓰이는 툴

하나의 뷰를 나타내며 가로/세로 크기와 다른 뷰와의 관계에 대해 화살표로 설정할 수 있는데 자세히 알아보자.  
뷰 크기 변경 컨트롤: 각모서리 가장자리에 있는 네모 모양을 통해 뷰의 크기를 늘리고 줄일 수 있다.  
관계 설정 컨트롤: 둥글게 생긴 부분으로 다른 뷰 사이의 관계를 지정할 수 있다. 가로축의 컨트롤은 다른 뷰의 가로축에만 연결되며, 세로축은 다른 뷰의 세로축에만 연결된다. 이미 관계가 지정되어 있을때 클릭하면 해제된다.  
베이스라인 컨트롤: View 안의 콘텐츠가 놓이는 기준선을 맞춘다. 해당 컨트롤을 선택하려면 커서를 몇 초간 올려 두어야 한다.

<br>
### ConstraintLayout에서 뷰 크기 지정
뷰의 크기는 우리가 알고 있듯이 고정된 크기, 뷰의 콘텐츠에 맞게 지정되는 방식, 부모크기를 따라가는 방식이 있다. 이를 UI적으로 표현하여 좀거 쉽게 설정가능하다.  

고정된 크기: 뷰의 사이즈가 고정되어 있다.  
부모 콘텐츠 크기: MATCH_PARENT방식으로 작동한다.  
뷰 콘텐츠 크기: 뷰의 크기에 따라 크기가 설정된다.  
수평 및 수직 정렬: 부모 뷰와 자식 뷰가 연결되어 있는 경우 정렬을 퍼센테이지로 설정할 수 있다. LinearLayout의 weight와 비슷하다고 생각하면 쉽다.  

<br>
### 팁!
처음 ConstraintLayout을 접해보면 생각보다 힘든 작업이 될 가능성이 높다. 이것저것 버튼을 눌러서 레이아웃을 맞추기에 생각보다 번거롭기 때문이다. 그래서 한 가지 팁을 소개해보겠다. 먼저 뷰들간의 관계를 연결하지 말고 배치만으로 작업을 한다. 연결 되어 있다면 모두 끊은 상태에서 배치 작업을 한뒤 자동 관계아이콘을 클릭하여 연결을 자동으로 구성 후 보정 작업을 하거나 간단한 경우 직접 연결해준다.  

ConstraintLayout은 알파단계로 약간의 버그가존재하며 디자인툴이 생각보다 빨리 움직이지 않고 한번씩 다운되는등의 문제점이 발생된다. 하지만 기존의 너무 깊은 레이아웃을 구조로 앱의 성능에 문제가 생긴점을 해결해줄 속 시원한 레이아웃이 될 것 같다. 그리고 BluePrint로 인해 디자이너도 툴을 쉽게 익히고 사용하는데 무리가 없을것 같다. 기존의 계층구조가 복잡한 레이아웃이 있다면 조금씩 바꿔나가는 것에 추천한다.  

 
