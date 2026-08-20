---
layout: post
title: 안드로이드 BottomSheet Behavior
tags: 안드로이드
comments: true
---
AppCompat V23.2에서 머트리얼 디자인 가이드 중 BottomSheet를 구현한  위젯이 추가 되었다. 기존의 CoordinatorLayout에 하나의 행동 방법으로 BottomSheet가 구현되었다. 또한 독립적으로 사용하기 위해 BottomSheetFragmentDialog를 이용하여 다이얼로그형태로도 사용가능하다. CoordinatorLayout의 Bottom Sheet Behavior를 어떻게 사용하는지 알아보자.  

<br>
## 어디에 사용되는가?
BottomSheet는 이미 구글 앱을 보면 많이 적용되어 있다. 구글 맵, 플러그, 뮤직등 다양한 디자인과 형태로 사용중이다. 이는 컨텐츠를 화면 전환 없이 더 많이 빠르게 보여주는데 사용된다. 또한 특정 액션을 했을때 사용할 여러가지 액션들을 선택할때도 사용된다.  

<br>
## 어떻게 사용하는가?
BottomSheet는 별도의 위젯으로 존재 하지는 않는다. CoordinatorLayout을 이용하여 자식뷰들의 행동을 구현한것으로 속성변경만으로 간단하게 BottomSheet를 사용 할 수 있다.  

– `android.support.design.widget.AppBarLayout$ScrollingViewBehavior`  
   (@string/appbar_scrolling_view_behavior)  
– `android.support.design.widget.BottomSheetBehavior`  
   (@string/bottom_sheet_behavior)  

CoordinatorLayout을 사용해본 적이 있다면 레이아웃에 `layout_behavior`속성을 사용해본 적이 있을 것이다. 속성의 값으로 `appbar_scrolling_view_behavior`를 사용한적이 있을 것이다. 이는 툴바와 스크롤 되는 뷰간의 상호 작용을 위해 구현된 behavior이다. BottomSheet또한 CoordinatorLayout의 하나의 behavior이며, `bottom_sheet_behavior`를 사용하면 된다. `bottom_sheet_behavior`는 스트링 이름이며 값은 클래스명으로 지정되어 있으며 해당 클래스가 로드되어 수행되는 구조이다.  


```xml
<android.support.design.widget.CoordinatorLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@android:color/white">

    <LinearLayout
        android:id="@+id/bottomSheet"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="#EEE"
        android:orientation="vertical"
        app:behavior_peekHeight="64dp"
        app:behavior_hideable="false"
        app:layout_behavior="@string/bottom_sheet_behavior">

        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:padding="16dp"
            android:textColor="@color/colorPrimaryDark"
            android:textAppearance="?android:attr/textAppearanceLarge"
            android:text="Bottom sheets" />


        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:padding="16dp"
            android:textAppearance="?android:attr/textAppearanceMedium"
            android:text="Bottom sheets slide up from the bottom edge of the screen to reveal additional content."/>


        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:padding="16dp"
            android:layout_marginTop="8dp"
            android:textAppearance="?android:attr/textAppearanceSmall"
            android:text="Modal bottom sheets are alternatives to menus, or simple dialogs, and can display deep-linked content from another app. They appear above other UI elements and must be dismissed in order to interact with the underlying content. When a modal bottom sheet slides into the screen, the rest of the screen dims, giving focus to the bottom sheet." />

    </LinearLayout>

    <android.support.design.widget.FloatingActionButton
        android:id="@+id/fab"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginRight="16dp"
        android:layout_marginEnd="16dp"
        android:src="@mipmap/ic_launcher"
        app:layout_anchor="@+id/bottomSheet"
        app:layout_anchorGravity="top|right" />

</android.support.design.widget.CoordinatorLayout>
```
<br>

CoordinatorLayout 자식뷰에서 BottomSheet를 사용하고 싶은 레이아웃에 `behavior`속성을 주면된다.  값에는 이미 정의된 `@string/bottom_sheet_behavior`값을 주면된다. 정의된 값은 라이브러리에 기본적으로 포함되어 있으며, 나타나지 않는 다면 AppCompat v23.2.0이상인지 확인해봐야 한다.  

BottomSheet높이는 자식뷰의 크기에 따라 변하게 되며 기본적으로 보여지게 될 높이는 `behavior_peekHeight` 속성을 통해 지정 할 수 있다. `behavior_peekHeight[dpi]` 값은 반드시 필요하며 값을 주지 않는 경우 자식뷰의 크기계산을 하지 못하기 때문에 뷰가 나타나지 않을 수 있다. 그리고 `behavior_peekHeight` 속성을 준 높이보다 더 최소한으로 사용자가 감출 수 있도록  `behavior_hideable[true/false]` 속성을 지원한다.  

- `behavior_peekHeight`: 기본적으로 보여질 높이
- `behavior_hideable`: 사용자의 액션에 의해 완전지 감춰질지 여부


<br>
## Listener
BottomSheet의 상태가 확장된 상태인지 완전히 숨겨져있는지등에 대한 상태를 알 수 있도록 Listener를 지원한다.  

```java

bottomSheet = findViewById(R.id.bottomSheet);
behavior = BottomSheetBehavior.from(mBottomSheet);
behavior.setBottomSheetCallback(new BottomSheetBehavior.BottomSheetCallback() {
    @Override
    public void onStateChanged(@NonNull View bottomSheet, int newState) {
        // newState = 상태값
    }
    @Override
    public void onSlide(@NonNull View bottomSheet, float slideOffset) {
    }
});
```

<br>
상태 값은 아래와 같이 5가지로 정의되어 있다.  

- STATE_COLLAPSED: 기본적인 상태이며, 일부분의 레이아웃만 보여지고 있는 상태. 이 높이는 `behavior_peekHeight`속성을 통해 변경 가능
- STATE_DRAGGING: 드래그중인 상태
- STATE_SETTLING: 드래그후 완전히 고정된 상태
- STATE_EXPANDED: 확장된 상태
- STATE_HIDDEN: 기본적으로 비활성화 상태이며, `app:behavior_hideable`을 사용하는 경우 완전히 숨겨져 있는 상태  

상태 값을 통해 좀 더 확장된 기능을 구현할 수 있다.  

이 BottomSheet는 이미 잘알려진 AndroidSlidingUpPanel과 동일하며, 좀 더 정리된 형태라고 보면된다. 머트리얼 디자인을 구현함에 있어서 CoordinatorLayout는 흔히 쓰이고 있으며 BottomSheet 또한 구현에 있어서 필수 요소가 될것이다. 특히 컨텍스트 메뉴를 BottomSheet를 통한 메뉴로 대체 되고 있는 느낌이 들며 사용성또한 좋기때문이다.


