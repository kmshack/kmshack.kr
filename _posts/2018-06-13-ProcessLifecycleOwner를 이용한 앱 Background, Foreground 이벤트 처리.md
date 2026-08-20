---
title: ProcessLifecycleOwner로 앱의 Background/Foreground 상태 감지하기
tags: [안드로이드, 아키텍처]
layout: post
last_modified_at: 2018-06-13
legacy: true
---

Android 앱 전체가 Background 또는 Foreground 상태로 전환되는 시점을 감지해야 할 때가 있다. 각 Activity의 Lifecycle을 따로 추적하는 대신 `ProcessLifecycleOwner`를 사용해 애플리케이션 수준의 상태 변화를 관찰하는 방법을 살펴본다.

Architecture Components를 아직 사용하지 않고 있다면 build.gradle에 아래와 같이 라이브러리를 추가 합니다.

```
dependencies{
  kapt "android.arch.lifecycle:compiler:1.1.1"
  implementation "android.arch.lifecycle:extensions:1.1.1"
}
```

Activity(or Fragment)의 Lifecycle 상태를 모니터링할 때 사용하는 LifecycleObserver 인터페이스를 동일하게 하나 구현합니다.

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

구현된 인터페이스를 Activity가 아닌 Application의 onCreate()에 ProcessLifecycleOwner를 이용하여 Observer하도록 합니다. ProcessLifecycleOwner는 내부적으로 Activity의 개수및 Lifecycle 상태를 모니터링 하는 역할을 합니다.

```java
class AppApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        ProcessLifecycleOwner.get().lifecycle
            .addObserver(AppLifecycleObserver())
    }
}
```

`ON_START`는 앱이 Foreground로 진입했음을, `ON_STOP`은 Background로 전환되었음을 의미한다. ProcessLifecycleOwner는 여러 Activity의 Lifecycle을 종합해 이벤트를 전달하므로 밀리초 단위의 즉각적인 상태 감지가 필요한 용도에는 적합하지 않을 수 있다.
ProcessLifecycleOwner에 대한 더 많은 정보는 [안드로이드 개발문서](https://developer.android.com/reference/android/arch/lifecycle/ProcessLifecycleOwner)를 참고 해주세요.
