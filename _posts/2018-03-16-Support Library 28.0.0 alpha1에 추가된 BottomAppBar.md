---
title: Support Library 28.0.0 alpha1에 추가된 BottomAppBar
tags: 안드로이드
layout: post
comments: true
---

지난 주 Google은 Android P 프리뷰를 발표하면서 디자인 서포트 라이브러리도 새로운 알파버전을 공개하였습니다. 
- [com.android.support:design:28.0.0-alpha1](https://developer.android.com/topic/libraries/support-library/revisions.html#28-0-0-alpha1)  

<br>
이 새로운 버전의 라이브러리에는 `MaterialButton, MaterialCardView, Chips` 및 `BottomAppBa`에 대한 레이아웃이 포함되어있습니다. 툴바를 확장한 BottomAppBar는 큰기기의 화면을때 사용자가 엄지손가락으로 버튼에 접근하지 못하는것에 대한 절충안으로 자용자에게 편의성을 제공하기위해 3가지의 방법을 지원합니다.
<br>

|:---------------:|
|<br> ![](/blog/images/2018-03-16-bottomappbar/1.png){:.center-image} <br>|

<br>
`FloatingActionButton`의 `app:fabCradleVerticalOffset` 속성을 이용하면 반원을 배치 시킬 수 있습니다. `pp:fabAlignmentMode` 속성을 이용하여 CENTER 또는 END로 위치를 변경 할 수 있습니다. 런타임시 이 두개의 속성을 변경하면 멋진 애니메이션으로 위치를 변경해줍니다.

```xml
<android.support.design.widget.CoordinatorLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <android.support.design.bottomappbar.BottomAppBar
        android:id="@+id/bottom_appbar"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_gravity="bottom"
        app:theme="@style/ThemeOverlay.AppCompat.Dark.ActionBar"
        app:popupTheme="@style/ThemeOverlay.AppCompat.Light"
        app:fabAttached="true"
        app:backgroundTint="@color/colorPrimary"
        app:fabCradleVerticalOffset="12dp"/>

    <android.support.design.widget.FloatingActionButton
        android:id="@+id/fab"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="bottom|center_horizontal"
        android:src="@drawable/ic_add_white_24dp"
        app:layout_anchor="@+id/bottom_appbar"/>

</android.support.design.widget.CoordinatorLayout>
```

아주 쉽게 사용할 수 있습니다. CoordinatorLayout에 BottomAppBar와 `FloatingActionButton`을 배치하고 `loatingActionButton`의 `layout_anchor` 속성을 `BottomAppBar`의 참조 ID로 지정하면 됩니다.  

<br>
### 몇가지 주의 사항
- Toolbar를 확장하여 `BottomAppBar`를 구현하였지만 `setSupportActionBar()`를 호출하면 중단됩니다.
- 배경식을 변경하기위해 `android:background`대신 `app:backgroundTint`를 호출 해야 합니다.
- `setTitle, setSubTitle`은 재정의되고 비어있기때문에 아무런 작동을 하지 않습니다.

Android P 프리뷰를 발표하면서 공개한 알파버전의 라이브러리인 만큼 아직 바뀔 부분이 많습니다. 뭔가 좀 어색해 보이면서도 안드로이드 스럽지않지 않지만 사용자의 접근성을 개선하기에는 좋아 보입니다. 앞으로 어떻게 바껴갈지 지켜볼만 하네요.  
  
<br>
### 그리고 알파버전에 들어 있는 추가 레이아웃에 대해 간단하게 언급 하자면..

**Chip, ChipGroup**  
키워드나 태그를 하나씩 보여주는 태그뷰이며 그룹으로 관리가 가능하며 다양한 스타일(Action, Filfer, Choice)를 기본으로 제공합니다. `ingleSelection`속성을 이용하면 그룹중에 하나만 선택 할 수있는 기능도 지원합니다.

**MaterialCardView**  
CardView의 확장버전이며 `strokeColor/StrokeWidt`h 속성이 추가 되었습니다.

**MaterialButton**  
기본 Button에서 c`ornerRadius`를 지원하여 라운드 처리가 가능하며 아이콘을 추가 할 수 있는 속성이 추가 되었습니다.

