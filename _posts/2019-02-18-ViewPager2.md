---
title: ViewPager2 맛보기
tags: 안드로이드 뷰페이저
layout: post
comments: true
---

[2011년에 출시된 ViewPager](https://android-developers.googleblog.com/2011/08/horizontal-view-swiping-with-viewpager.html)가 7년여 만에 [ViewPager2](https://developer.android.com/jetpack/androidx/releases/viewpager2#1.0.0-alpha01) 알파버전을 출시 하였습니다. 출시후 많은 개발자들이 ViewPager의 개선을 필요로 하였습니다.

앱에 많이 사용되고있지만 확실히 좋은 위젯은 아닙니다. FragmentPagerAdapter나 FragmentStatePagerAdapter를 사용할때 Fragment없이 ViewPager를 사용하면 안되는지에 대해 적어도 한번 이상은 궁금했었습니다. 
그리고 RTL지원과 수직페이징 처리등 다양한 기능을 지원하도록 요청하였습니다. 오픈소스를 통한 솔루션은 있으나 공식적인 라이브러리 업데이트는 아직 없습니다. 지금까지 였습니다..  

<br>

이제 모두 지원 합니다.  
## ViewPager2  

프로젝트는 AndroidX로 구성하고 minSdkVersion 14이상을 지원해야 합니다.
build.gradle에 아래 라이브러리를 추가합니다.
```xml
implementation 'androidx.viewpager2:viewpager2:1.0.0-alpha01'
```

<br>
RecyclerView에 익숙하다면 ViewPager2를 구성하는것은 매우 익숙합니다. RecyclerView.Adapter를 상속받아 어댑터를 생성합니다. 물론 ViewHolder도 필요합니다.  

```java
class AppPagerAdapter(private val apps: Array<String>) : RecyclerView.Adapter<AppViewHolder>() {
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AppViewHolder {
        return AppViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.app_pager_item, parent, false))
    }

    override fun onBindViewHolder(holder: AppViewHolder, position: Int) {
        holder.txtApp.text = apps[position]
    }

    override fun getItemCount() = apps.size
}

class AppViewHolder(view: View) : RecyclerView.ViewHolder(view) {
    val txtApp: TextView = view.findViewById(R.id.txt_app)
}
```

<br>
마지막으로 RecyclerView와 마찬가지로 ViewPager2의 Adapter를 설정합니다. 여기서 RecyclerView에서 처럼 LayoutManager는 필요없습니다. ORIENTATION_VERTICAL를 통해 스크롤 하도록 성정가능합니다.  

```java
ViewPager2.orientation = ViewPager2.RIENTATION_VERTICAL
```

<br>
ViewPager2는 아직 알파버전인 단계로 버그나 문제점은 보여집니다. 하지만 ViewPager의 View 재사용성 문제를 RecyclerView의 ViewHolder패턴을 그대로 사용하면서 해결함과 동시에 RecyclerView에 익숙한 개발자들에게 별도의 학습없이 적용할 수 있게 솔류션을 제공하였습니다. 또한 orientation기능 도입으로 가로 스크롤뿐만 세로스크롤도 지원하게 되었습니다. 또한 RTL도 지원합니다!  

추가 기능외 전 버전의 notifyDataSetChanged()가 실행되지 않는 문제를 해결하였습니다. getItemPosition에서 POSITION_NONE을 강제로 반환하도록 하여 문제를 회피했던 경험 모두 있으실것 같은데 이제 해결되었습니다.  

<br>

### 알려진 버그 (1.0.0 알파 01기준)  
-ClipToPadding 미지원  
-TabLayout 미지원  
-pageWidth 미지원(강제 가로/세로 100%)  
-currentItem 설정시 이전 페이지 보이는 현상  
