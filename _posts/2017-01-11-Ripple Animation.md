---
layout: post
title: Ripple Animation
tags: 안드로이드
comments: true
---
안드로이드 5.0(API 21)의 머트리얼 디자인에서 물결 터치 효과가 처음 소개 되었습니다. 터치 피드백에 대해 UI요소와 사용자간의 상호작용을 비주얼 하게 머트리얼 디자인에서는 제공합니다. 예를 들어 버튼을 터치하면 즉각 물결 효과가 표시 됩니다. 이것은 안드로이드 5.0에서 기본으로 제공됩니다.  

Ripple 애니메이션은 새롭게 생긴 `RippleDrawable`을 이용합니다. 물결 효과는 뷰 경계에서 끝나거나 경제를 넘어 확장 할 수 있도록 구성 할 수 있습니다. 아래 스크린 샷은 터치한 위치에서 점점 퍼지면서 잔물결 효과가 버튼의 가장자리로 퍼지는 것을 보여 주고 있습니다. 터치를 끝마치게 되면 뷰는 다시 원래 모양으로 돌아갑니다. 이 모든것이 1초 내로 이루어 지지만 애니메이션 시간은 더 길거나 짧게 변경 할 수 있습니다.  

<br>
### View 클릭처리
이런 물결 효과는 안드로이드 5.0에서 기본적으로 제공하며, 아래와 같이 정의된 attr를 사용하면 된다.  

```xml
android:background="?android:attr/selectableItemBackground"
```

<br>
### 버튼 처리
대부분의 버튼은 Drawable를 사용합니다. 일반적으로 selector에서 몇가지 상태에 맞는 리소스를 설정합니다.  

```xml
<selector xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:state_pressed="true" android:drawable="@drawable/button_pressed"/>
    <item android:drawable="@drawable/button_normal"/>
</selector>
```

안드로이드 5.0부터는 더 이상 selector를 사용하지 않아도 됩니다. ripple를 사용하면됩니다.  

```xml
<ripple xmlns:android="http://schemas.android.com/apk/res/android"
    android:color="?android:colorControlHighlight">
    <item android:drawable="@drawable/button_normal" />
</ripple>
```

물결을 적용할 색을 선택하기만 하면됩니다. 안드로이드에 정의된 `attr/colorControlHighlight`의 기본 값이 마음에 들지 않는 경우 직접 다른색으로 변경하는것 보다 테마 스타일을 통해서 색상을 변경하면 됩니다. 테마 스타일을 변경하게 되면 `colorControlHighlight`가 사용되는 모든 색상들을 한번에 변경 할 수 있습니다.  


```xml
<resources>
  <style name="AppTheme" parent="android:Theme.Material.Light.DarkActionBar">
    <item name="android:colorControlHighlight">@color/your_custom_color</item>
  </style>
</resources>
```

처음 설명에서 가장자리로 퍼질때 경계 끝이 아닌 경계를 넘어서 확장 할 수 있다고 설명했다. 경계를 넘도록 물결 효과를 적용 하고 싶다면 attr/selectableItemBackgroundBorderless를 사용하면 된다. 큰뷰 내에 일부분의 View에서 더 잘작동 합니다.  

