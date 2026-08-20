---
title: ProcessLifecycleOwner를 이용한 앱 Background/Foreground이벤트 처리
tags: [안드로이드, 아키텍쳐]
layout: post
comments: true
---

안드로이드 앱을 개발을 하다보면 앱이 Background, Foreground 상태에 대한 이벤트를 탐지를 필요로 합니다. 일반적으로 ActivityManager의 Activity의 갯수와 Lifecycle에 따라 이벤트 탐지를 합니다. 모든 Activity의 Lifecycle을 관리한다는 것은 번거로운 일입니다. 하지만 Android Architecture Components를 이미 사용한다면 간단히 몇줄 만에 해당 이벤트를 탐지 할 수 있습니다.

Architecture Components를 아직 사용하지 않고 있다면 build.gradle에 아래와 같이 라이브러리를 추가 합니다.

```
dependencies{
  kapt "android.arch.lifecycle:compiler:1.1.1"
  implementation "android.arch.lifecycle:extensions:1.1.1"
}
```

Activity(or Fragment)의 Lifecycle 상태를 모니터링할때 사용하는 LifecycleObserver 인터페이스를 동일하게 하나 구현합니다.

```java
class AppLifecycleObserver : LifecycleObserver {

    @OnLifecycleEvent(Lifecycle.Event.ON_START)
    fun onForeground() {
        //foreground
    }

    @OnLifecycleEvent(Lifecycle.Event.ON_STOP)
    fun onBackground() {
        //background
    }
}
```

구현된 인터페이스를 Activity가 아닌 Application의 onCreate()에 ProcessLifecycleOwner를 이용하여 Observer하도록 합니다. ProcessLifecycleOwner는 내부적으로 Activity의 갯수및 Lifecycle 상태를 모니터링 하는 역할을 합니다.

```java
class AppApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        ProcessLifecycleOwner.get().lifecycle
            .addObserver(AppLifecycleObserver())
    }
}
```

이제 우리는 ON_START이벤트가 발생하는 경우 앱이 Foreground 상태로 진입을 의미하며, ON_STOP이벤트의 경우 Background로 진입했다는 것을 알 수 있습니다. 이러한 이벤트는 Activity의 Lifecycle를 모니터링 하기때문에 의도치 않게 Activity가 중도에 destory이 되어 새롭게 create되는 경우 이벤트가 지연될 수 있습니다. 이는 밀리세컨드의 단위로 정확성을 요구하는 곳에서 사용이 부적절할 수 있음을 의미합니다.
ProcessLifecycleOwner에 대한 더 많은 정보는 [안드로이드 개발문서](https://developer.android.com/reference/android/arch/lifecycle/ProcessLifecycleOwner)를 참고 해주세요.
