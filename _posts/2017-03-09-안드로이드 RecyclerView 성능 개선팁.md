---
title: 안드로이드 RecyclerView 성능 개선팁
tags: 안드로이드
layout: post
comments: true
---

RecyclerView는 제한된 화면에서 큰 데이터 세트를 제공하기 위한 유연한 View입니다. RecyclerView는 안드로이드 앱 개발에 있어서 가장 중요한 위젯 중 하나인 ListView를 좀 더 발전시킨 버전입니다. 뉴스 피드나 연락처 목록을 구현 시 사용자가 빠르게 스크롤할 때 성능 문제 또는 불필요한 지연을 방지하기 위해 ListView를 사용했습니다. RecyclerView는 ListView의 성능과 지연을 100% 방지 못하는 문제점을 해결한 버전입니다.  

이 글은 RecyclerView 사용방법에 관한 글이 아닙니다. RecyclerView를 사용하면서 유용한 정보와 중요한 규칙, 절대 하지 말아야 할 것을 하나씩 살펴보겠습니다.  

<br>
## 피할 수 있는 문제

**1) 제대로된 View 재사용**  
`ViewHolder` 내부에서 View 애니메이션을 절대 사용하면 안됩니다. (ex. `itemView.animate()` 호출)
`ItemAnimator`는 View 애니메이션을 처리할 수 있는 유일한 구성 요소입니다. (ex. `RecyclerView.setItemAnimator()` )  

ListView에서는 아이템 View 애니메이션 처리를 위해 `getView()`에서 작업을 하였습니다. 이는 View의 재사용 문제가 있으며 RecyclerView에서 동일한 패턴으로는 사용해서는 절대 안됩니다.  

<br>
**2) 세분화된 Adapter 업데이트**  
변경이 된 데이터에 대해서만 Adapter 업데이트를 하세요. (ex. `notifyItemChanged(4)`)
`NotifyItemRangeChanged()`는 필요로 하지 않는 View를 업데이트하기 때문에 불필요하게 사용하지 마세요. (ex. `notifyItemRangeChanged(0, getItemsCount()` )  

[DiffUtil](https://developer.android.com/reference/android/support/v7/util/DiffUtil.html)을 사용하여 Adapter의 성능을 측정 해 볼 수 있습니다.  

<br>
**3) onBindViewHolder position != final**  
절대 `onBindViewHolder` 내부에서 `View.OnClickListener`를 셋하지 마세요. `onBindViewHolder`는 데이터를 View에 바인딩하기 위해서만 사용해야 합니다.  


아래와 같이 사용합니다.  

```java
class ColorViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
    ColorViewHolder(View itemView, ItemClickListener clickListener) {
        super(itemView);
        itemView.setOnClickListener(this);
    }
    @Override
    public void onClick(View v) {
        removeAtPosition(getAdapterPosition())
    }
}
```
이러한 간단한 규칙 3가지만으로도 RecyclerView의 성능은 보장됩니다.  

<br>
**데이터 변경에 따른 쉬운 애니메이션 처리방법**
- 위에서 언급한 `RecyclerView.setItemAnimator()`를 직접 구현해도 되지만 `notifyItemChanged(), notifyItemRangeChanged(), notifyItemInserted(), notifyItemMoved(), notifyItemRemoved()`를 사용하기만 해도 기본적인 애니메이션이 적용됩니다.
- `getItemId(int position)`와 함께 `setHasStableIds(true)`를 사용하면 `RecyclerView.notifyDataSetChanged()`로 모든 애니메이션을 자동으로 처리할 수 있습니다.  


<br>
## 성능 팁!

부드러운 스크롤을 원한다면 아래의 간단한 규칙을 지키면 됩니다.  

- 프레임 당 모든 작업을 수행하는데 16ms내로 작업하도록 해야 합니다. 개발자 옵션에서 [프로필 GPU 렌더링](https://developer.android.com/studio/profile/dev-options-rendering.html) 옵션을 사용하여 성능을 모니터링하세요.
- 레이아웃 구조를 최적화 및 간단한 구조를 유지하세요.
- 깊은 레이아웃 계층을 피하기 위해 [HierarchyViewer](https://developer.android.com/studio/profile/hierarchy-viewer.html)를 사용하세요.
- [오버드로우 문제](https://developer.android.com/studio/profile/dev-options-overdraw.html)를 피하고 시스템 도구로 모니터링 하세요.
- TextView에 긴 텍스트를 설정하지 마세요. 텍스트 줄을 계산하기위해 많은 연산이 필요하여 성능을 떨어집니다. 텍스트 끝 말줄임표나 최대 줄수를 설정 해두는 것도 하나의 방법입니다.
- 렌더링 퍼포먼스를 향상하기위해 [LayoutManager.setItemPrefetchEnabled()](https://medium.com/google-developers/recyclerview-prefetch-c2f269075710#.psau15lh2)를 사용하세요.  


<br>
> RecyclerView는 안드로이드의 강력한 위젯이며 모든 결과를 얻을 수 있습니다. 하지만 잘못된 작은것 하나가 앱의 품질을 좌우 합니다.