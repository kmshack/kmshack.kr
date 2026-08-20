---
title: 안드로이드 스타일 VS 테마
tags: 안드로이드
layout: post
comments: true
---

Android 5.0 롤리팝에서는 View의 테마(android:theme)에 대해서 재 정의하는 새로운 기능을 제공한다. 이것을 사용하는 방법과 왜 사용하느지에대 대한 이유를 살펴보겠다.    

<br>
## 왜?
아마 이 글을 보는 대다수의 개발자는 시스템에 정의된 테마를 그동안 모르고 사용했을 가능성이 대단히 높다.  

**Theme.Holo.Light.DarkActionBar**  
`Light.DarkActionBar` 테마는 순서 상으로 두번째로 생각할 수 있다. 이는 콘텐츠에 대한 Light 테마이지만, 액션바는 Dark 테마를 사용한다.  

별도의 테마를 제공하지 않고 텍스트 색상과 다른 전경색상에 대해서 정반대로 설정하도록 기능이 필요하다. `actionBarWidgetTheme` 속성은 액션바에서 사용 할 수 있도록 이미 시스템에서 특별히 허용하고 있다.  

### 플랫폼의 DarkActionBar에 정의된 테마

```xml
<style name="Theme.Holo.Light.DarkActionBar">
    <item name="android:actionBarWidgetTheme">@android:style/Theme.Holo</item>
</style>
```
  
이렇게 함으로써 Dark테마의 액션바를 만들수 있다.

 
<br>
## 기본기능
[ContextThemeWrapper](https://developer.android.com/reference/android/view/ContextThemeWrapper.html)클래스로 API1부터 사용이 가능하며 이는 내부적으로 기존의 컨텍스르틑 래핑하고 그상황에 맞는 최상단의 테마로 덮어쓰게 된다.  

 
<br>
### ThemeOverlay
안드로이드 5.,0 롤리팝에서 주요 두가지 오버레이가 있다. 이는 위에서 설명한 `ContextThemeWrapper`의 작동방식을 사용하였다.
```
ThemeOverlay.Material.Light
ThemeOverlay.Material.Dark
```  

이들은 Theme.Material 테마를 덮어씌어 Light 테마와 Dark 테마의 속성을 가지게 된다.  

<br>
## ThemeOverlay + ActionBar
좀 예리한 개발자라면 ActionBar용 ThemeOverlay를 볼 수 있을 것이다.  
```
ThemeOverlay.Material.Light.ActionBar
ThemeOverlay.Material.Dark.ActionBar
```  

이는 `actionBarTheme`속성을 통해 ActionBar또는 직접적으로 Toolbar에 설정이 가능하다. 이는 `textColorPrimary`을 통해 자동으로 텍스트 와 아이콘의 색상을 지정되는 등의 현재 부모와 가르게 할 수 있는 `colorControlNormal`속성을 유일하게 지니고 있다.  

<br>
## android:theme
이렇게 theme의 속성을 통해 Toolbar는 Dark테마를 만들수있다. 주의 할점은 롤리팝에서만 theme속성이 적용된다는 점이다.  


```xml
<Toolbar
    android:layout_height="?android:attr/actionBarSize"
    android:layout_width="match_parent"
    android:background="?android:attr/colorPrimaryDark"
    android:theme="@android:style/ThemeOverlay.Material.Dark.ActionBar" />
```

<br>
## 예제  
다음 질문을 통해 어떻게 해결해야 되는지 생각해보자.  

Q. 특정 View에 `android:colorEdgeEffect` 속성만 변경하고 싶은 경우 어떻게 해야하나?  

A. `colorEdgeEffect`속성은 롤리팝의 새로문 속성으로 리스트에 스크롤시 끝이나 첫 시작점을 알려주는 기능으로 색상변경이 가능하다. 해당 속성만 변경 하기위해서 아래와 같이 `ThemeOverlay`를 parent로 설정하고 item을 통해 변경할 속성과 같을 지정해준다. 그리고 속성만 변경하고 싶은 View에서 theme속성을 통해 만들 style을 지정해준다.  

  
**res/values/themes.xml**
```xml
<style name="RedThemeOverlay" parent="android:ThemeOverlay.Material">
    <item name="android:colorEdgeEffect">#FF0000</item>
</style>
```
  
**res/layout/fragment_list.xml**
```xml
<ListView
    ...
    android:theme="RedThemeOverlay" />
```
단, android:theme 속성은 롤리팝이상에서만 사용가능하다.  


<br>
## Theme VS Style
위의 예제는 style을 통해서도 충분히 동일한 역할을 수행 할 수 있다. 그렇다면 정확히 차이점은 무엇인가?  

Theme는 원천적인 스타일로 적용되는 것이며 임의로 변경하지 않는한 바뀌지 않는다. Style는 내부적으로 `LayoutInflater`을 통해 View가 생성시 명시적인 속성으로 변경된다.  


**즉, Theme는 전역적, Style은 로컬적이다.**


