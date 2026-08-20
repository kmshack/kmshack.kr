---
title: 안드로이드에서 자연스러운 키보드 변경 처리하기
tags: 안드로이드
layout: post
comments: true
---

[Dank](https://play.google.com/apps/testing/me.saket.dank)라는 앱을 사용할때 부드럽게 잘 작동하는것에 많은 사용자들은 만족스러워 할것입니다. 앱은 화면 변경시 적절한 모션처리를 잘하였지만, 좀더 부드럽게 느껴지는 이유는 키보드 변경처리를 잘하였기 때문입니다.  

소프트키보드가 표시되면 안드로이드는 콘텐츠의 크기를 즉각 변경합니다. (`windowSoftInputMode`를 설정하지 않은경우) 이로 인해 레이아웃에 부자연스러운 변화가 생깁니다. 아쉽게도 플랫폼이나 대다수의 앱이 이를 처리하지 않기때문에 사용자들은 정상적으로 작동한다는것으로 착각하고 있습니다.   


역시 글로만 봐서 이해하기 힘들기때문에 차이점을 명확히 알아보기 위해 Google Keep과 Dank 앱을 영상으로 비교 해보겠습니다.  

|:---------------:|
|<br> ![](/blog/images/2018-10-09-smooth_keyboard/1.gif){:.center-image} Google Keep|

|:---------------:|
|<br> ![](/blog/images/2018-10-09-smooth_keyboard/2.gif){:.center-image} Dank|

<br>

위의 화면을 통해 비교해 보면 Dank앱이 키보드가 반응하면 콘텐츠를 위쪽으로 부드럽게 크기를 조정하며 스크롤하는것을 볼 수 있습니다. 반면 Google Keep은 키보드의 반응에  변동이 없어 컨텐츠영역에도 아무런 반응이 없어 보입니다.  

좀 더 부드러운 화면으로 비교를 원한다면 영상으로 확인해보세요.( [Google Keep](/blog/images/2018-10-09-smooth_keyboard/keep_keyboard_720p.mp4), [Dank](/blog/images/2018-10-09-smooth_keyboard/dank_keyboard_720p.mp4))  

<br>

눈치 빠른 분들은 Dank앱이 처리하는 작은 트릭을 발견하실 수 있습니다. 이 작은 트릭은 키보드가 표시되면 Activity의 전체 화면의 크기가 조정된다는 것에 있습니다. 이는 Activity를 구성하는 View 계층의 최상단 레이아웃(`DecorView`)에 아무런 영향을 받지 않고 처리 했다는 사실을 알 수 있습니다. 실제로 뷰의 크기가 저장되는 레이아웃ID는 콘텐츠 레이아웃(`android.R.id.content`)입니다. 이것은 `DecorView`내의 컨텐츠 레이아웃을 제어할 수 있다는 것을 의미합니다.

Activity를 구성하는 View Tree는 일반적으로 다음과 같습니다.  

**DecorView**  
```java
- LinearLayout
-- FrameLayout  <- android.R.id.content
--- LinearLayout
---- Activity content
```

|:---------------:|
|<br> ![](/blog/images/2018-10-09-smooth_keyboard/3.gif){:.center-image} <br>|


리사이즈 되는 부분을 제어하기 위해 콘텐츠 레이아웃(android.R.id.content)의 크기가 변경되는 것을 감지하는 유틸 클래스를 만들었습니다. View의 크기가 변경되면 컨텐츠의 전체 높이에서 변경된 높이만큼 변경되도록 애니메이션처리 합니다.  

<br>

```java
val decorView = activity.window.decorView

decorView.viewTreeObserver.addOnPreDrawListener { 
  val contentHeight = contentViewFrame.height
  val sizeChanged = contentHeight != previousHeight

  if (sizeChanged) {
    animateSizeChange(from = previousHeight, to = contentHeight)
  }

  previousHeight = contentHeight
}
```

|:---------------:|
|<br> ![](/blog/images/2018-10-09-smooth_keyboard/4.gif){:.center-image} <br>|


```java
fun animateSizeChange(from: Int, to: Int) {
  // Immediately snap back to the original size.
  contentView.setHeight(from)
  
  ObjectAnimator.ofInt(from, to)
    .addUpdateListener { 
      val h = it.animatedValue as Int
      contentView.setHeight(h) 
    }
    .start()
}
```

이와 관련된 모든 코드는 [여기](https://github.com/saket/FluidKeyboardResize)를 통해 확인하세요.  

<br>

컨텐츠 뷰의 크기에 따라 애니메이션처리를 하여 높이를 변경하는 것은 손이 많이 가는일이지만 앱의 품질을 높이는 큰역할을 합니다. 다르게 구현할 수 있는 방법도 많고, 이것이 최상의 솔루션은 아니지만 여러달 테스트하면서 문제점을 발견하지는 못하였습니다.


<br>
<br>
참고: [https://saket.me/smoothly-reacting-to-keyboard/](https://saket.me/smoothly-reacting-to-keyboard/)
