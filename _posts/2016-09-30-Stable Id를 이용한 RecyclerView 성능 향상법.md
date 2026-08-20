---
layout: post
title: Stable Id를 이용한 RecyclerView 성능 향상법
tags: 안드로이드
comments: true
---

RecyclerView는 ListView를 완전히 대체할 수 있을 만큼 기능과 성능이 크게 향상되었다. ListView에서도 어떻게 하면 끊김 없이 빠른 스크롤을 지원할까라는 고민을 해왔었고, RecyclerView를 사용하다 보면 똑같은 고민을 또 하게 될 것이다.  

ViewHolder라는 패턴을 통해 ListView의 성능을 RecyclerView에서 크게 향상할 수 있었다. 재활용하는 뷰들의 클래스를 View 태그 또는 Array에 저장하고 필요할 때 바로 가져와서 사용하는 방법으로 성능을 크게 향상하였다. ListView에서 재활용되는 뷰를 해당 포지션에 맞게 가져오는 곳에서 성능을 향상할 수 있었다면, RecyclerView는 가져온 View에 데이터를 바인드 시 최적화할 수 있는 방법을 제공하고 있다.  

<br>
`HasStableIds`사용을 통해 데이터 바인드 시 `onBindViewHolder()`를 최적화 되게 호출할 수 있다. 아래 2가지 중 하나만이라도 해당한다면 성능을 크게 향상할 수 있다.  

- 똑같은 데이터가 반복적으로 나타는 리스트이다.
- `notifyDataSetChanged`를 자주 호출한다.  

<br>
`HasStableIds`는 `Adapter.setHasStableIds(boolean)`을 통해 설정할 수 있으며, 사용하는 경우 어댑터의 `getItemId(int)`를 반드시 구현해야 작동한다.  

`getItemId(int)`를 통해 해당 아이템은 고정된 상태로 설정된다. 예를 들어 아래와 값을 반환되게 구현했다면 어떤 성능적인 변화가 일어날까?  


position | return
--- | --- 
0 | 100
1 | 200
2 | 300
3 | 100
4 | 400
5 | 500

`onBindViewHolder(view, int)`는 포지션이 0, 1, 2, 4, 5 만 호출된다. 3번은 0번째 포지션에서 같은 고정된 ID를 반환했기 때문에 같은 데이터로 인식하여 `onBindViewHolder(view, int)`가 호출되지 않는다. 같은 데이터임을 알고 데이터 바인드를 할 필요가 없기 때문에 호출되지 않으며 그만큼 성능은 향상된다.  


position | return
--- | --- 
0 | 100
1 | 200
2 | 600
3 | 300
4 | 100
5 | 400
6 | 500

포지션 2번에 데이터를 추가하고 `notifyDataSetChanged()`를 호출하였다. 이때 `onBindViewHolder(view, int)`는 현재 보이고 있는 포지션이 모두 호출되지만 `StableId`를 사용하게 된다면 이미 호출된 고정된 ID를 제외한 위치가 호출된다. `notifyDataSetChanged()`를 하였음에도 변경되는 ID만을 골라 해당 포지션만 `onBindViewHolder(view, int)`를 호출하게 됨으로 그만큼 성능은 향상된다.






