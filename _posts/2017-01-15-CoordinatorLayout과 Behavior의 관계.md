---
layout: post
last_modified_at: 2017-01-15
title: CoordinatorLayout과 Behavior의 관계
tags: 안드로이드
legacy: true
---
`CoordinatorLayout`의 Behavior는 한 View의 스크롤이나 위치 변화에 다른 View가 반응하도록 연결한다. Support Library가 제공하던 `ScrollingViewBehavior`와 `BottomSheetBehavior`를 중심으로 구성 요소 사이의 관계를 살펴본다.  

```
android.support.design.widget.AppBarLayout$ScrollingViewBehavior
- android.support.design.widget.BottomSheetBehavior  
```

<br>
`Behavior`를 사용하기 위해서는 `CoordinatorLayout`을 통해서 사용되는데, `CoordinatorLayout`은 자식 뷰의 스크롤의 변화 상태를 다른 자식 뷰들에게 전달 해주는 역할을 합니다. 좀 더 쉽게 말해 [NestedScrollView](https://developer.android.com/reference/android/support/v4/widget/NestedScrollView.html)나 `RecyclerView`등에 스크롤의 상태를 판단하여 정의된 반응을 하기 위한 `View`에 `Behavior`를 등록하면 됩니다.

```xml
<android.support.design.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fitsSystemWindows="true">

    <android.support.design.widget.AppBarLayout
        android:id="@+id/app_bar"
        android:layout_width="match_parent"
        android:layout_height="@dimen/app_bar_height"
        android:fitsSystemWindows="true"
        android:theme="@style/AppTheme.AppBarOverlay">

        <android.support.design.widget.CollapsingToolbarLayout
            android:id="@+id/toolbar_layout"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:fitsSystemWindows="true"
            app:contentScrim="?attr/colorPrimary"
            app:layout_scrollFlags="scroll|exitUntilCollapsed">

            <android.support.v7.widget.Toolbar
                android:id="@+id/toolbar"
                android:layout_width="match_parent"
                android:layout_height="?attr/actionBarSize"
                app:layout_collapseMode="pin"
                app:popupTheme="@style/AppTheme.PopupOverlay" />

        </android.support.design.widget.CollapsingToolbarLayout>
    </android.support.design.widget.AppBarLayout>

    <android.support.v4.widget.NestedScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        app:layout_behavior="android.support.design.widget.AppBarLayout$ScrollingViewBehavior">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_margin="@dimen/text_margin"
            android:text="@string/large_text" />

    </android.support.v4.widget.NestedScrollView>

</android.support.design.widget.CoordinatorLayout>
```
<br>

이해를 돕기위해 안드로이드 서포트 라이브러리에서 제공해주는 Behavior를 한번 보겠습니다. NestedScrollView에 `layout_behavior`에 `AppBarLayout$ScrollingViewBehavior`가 정의가 되어 있습니다. [NestedScrollView](https://developer.android.com/reference/android/support/v4/widget/NestedScrollView.html)의 반응에 따라 AppBarLayout이 반응됩니다.  

CoordinatorLayout는 NestedScrollView가 스크롤 시 layout_behavior에 정의된 레이아웃으로 스크롤 정보를 전달 하는 역할을 합니다. 그럼 AppBarLayout의 ScrollingViewBehavior가 정보를 받아서 AppBarLayout 자신을 변형하도록 하는 구조입니다.  

CoordinatorLayout이 스크롤되는 것은 Behavior에 구현된 NestedScrollingParent를 통해 전달 됩니다. 즉, CoordinatorLayout는 [NestedScrollingParent](https://developer.android.com/reference/android/support/v4/view/NestedScrollingParent.html)가 구현되어 있으며 스크롤 되는 View들은 [NestedScrollingChild](https://developer.android.com/reference/android/support/v4/view/NestedScrollingChild.html)가 구현되어 있어야 Behavior가 전달 됩니다. 그렇기 때문에 기존의 ScrollView나 ListView는 NestedScrollingChild가 구현되어 있지 않아 Behavior를 통해 스크롤 정보전달이 되지 않습니다.  

<br>

이렇게 CoordinatorLayout의 역할과 Behavior의 관계를 알고 있다면 Behavior를 커스텀해서 구현하는데 전혀 문제 없을 것입니다.
