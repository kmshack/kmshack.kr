---
title: Android 스타일과 테마 이해하기
tags: 안드로이드
layout: post
last_modified_at: 2015-06-22
legacy: true
---

Android 5.0 롤리팝부터는 `android:theme` 속성으로 개별 View의 테마를 재정의할 수 있다. 스타일과 테마의 차이, 그리고 이 기능이 필요한 이유를 살펴본다.    

<br>
## 왜?
아마 이 글을 보는 대다수의 개발자는 시스템에 정의된 테마를 그동안 모르고 사용했을 가능성이 대단히 높다.  

**Theme.Holo.Light.DarkActionBar**  
`Light.DarkActionBar`는 콘텐츠에는 Light 테마를, 액션바에는 Dark 테마를 적용한다.  

별도의 테마를 제공하지 않고 텍스트 색상과 다른 전경색상에 대해서 정반대로 설정하도록 기능이 필요하다. `actionBarWidgetTheme` 속성은 액션바에서 사용할 수 있도록 이미 시스템에서 특별히 허용하고 있다.  

### 플랫폼의 DarkActionBar에 정의된 테마

```xml
<style name="Theme.Holo.Light.DarkActionBar">
    <item name="android:actionBarWidgetTheme">@android:style/Theme.Holo</item>
</style>
```
  
이렇게 하면 Dark 테마의 액션바를 만들 수 있다.

 
<br>
## 기본기능
[ContextThemeWrapper](https://developer.android.com/reference/android/view/ContextThemeWrapper.html)는 API 1부터 사용할 수 있으며, 기존 Context를 감싼 뒤 지정한 테마를 적용한다.  

 
<br>
### ThemeOverlay
Android 5.0 롤리팝에는 두 가지 주요 ThemeOverlay가 있다. 내부적으로는 앞에서 설명한 `ContextThemeWrapper` 방식을 사용한다.
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

`actionBarTheme` 속성으로 ActionBar나 Toolbar에 적용할 수 있다. `textColorPrimary`, `colorControlNormal` 같은 속성을 부모 테마와 다르게 지정할 때 유용하다.  

<br>
## android:theme
이처럼 theme 속성으로 Toolbar에 Dark 테마를 적용할 수 있다. 이 글의 예제는 롤리팝 당시의 플랫폼 동작을 기준으로 한다.  


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

A. `colorEdgeEffect` 속성은 롤리팝에 추가된 속성으로, 리스트의 처음이나 끝에서 표시되는 스크롤 효과의 색상을 바꿀 수 있다. 아래와 같이 `ThemeOverlay`를 parent로 설정하고 item에 변경할 속성과 값을 지정한 뒤, 해당 View의 theme 속성에 만든 style을 적용한다.

  
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
단, android:theme 속성은 롤리팝이상에서만 사용 가능하다.  


<br>
## Theme VS Style
위의 예제는 style을 통해서도 충분히 동일한 역할을 수행할 수 있다. 그렇다면 정확히 차이점은 무엇인가?  

Theme는 원천적인 스타일로 적용되는 것이며 임의로 변경하지 않는한 바뀌지 않는다. Style는 내부적으로 `LayoutInflater`을 통해 View가 생성시 명시적인 속성으로 변경된다.  


**즉, Theme는 전역적, Style은 로컬적이다.**
