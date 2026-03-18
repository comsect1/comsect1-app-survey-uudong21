var DbSurveyUudong21PackTxt = `
[meta]
id=youth-policy-checkup-2026
title=유유기지 21시 편의점 자가진단
introMessage=나의 생활 재고 상태를 점검해 보세요!\\n해당하는 항목을 모두 체크해 주세요.
introEmoji=🏪

[scoring]
method=sum

[threshold:critical]
min=8
emoji=🚨
color=#ef4444
cssModifier=high
message=정책 완충이 절실합니다!\\n긴급 수혈(상담)을 받으세요.

[threshold:caution]
min=4
emoji=⚡
color=#f59e0b
cssModifier=low
message=정책 비타민 상담으로 에너지를 채워보세요.

[threshold:good]
min=0
emoji=✨
color=#22c55e
cssModifier=low
message=더 큰 성장을 위한 플러스 혜택을 쇼핑해 보세요.

[result]
title=나의 생활 재고 점검 결과
suffix=점
subtitle=총 12항목 중 체크한 항목
recommendHeading=🏪 추천 상담 프로그램

[recommend]
emoji=💬
title=정책 비타민 1:1 상담
description=나에게 맞는 청년 정책을 전문 상담사와 함께 찾아보는 시간
url=https://youth.incheon.go.kr/program/programInfoDetail.do?prgm_seq=1668&cate2=all&prgmdiv=donggu
gradient=purple-pink

[recommend]
emoji=📋
title=청년 정책 맞춤 가이드
description=생활 안정·마음 건강·진로·정보 격차 영역별 정책 안내
url=https://youth.incheon.go.kr/program/programInfoDetail.do?prgm_seq=1673&cate2=all&prgmdiv=donggu
gradient=blue-purple

[questions]

[multi]
생활 안정 — 나의 재고 상태는? (복수 선택)
고정 지출(월세, 교통비 등)이 부담된다=1
비상금이 부족하다=1
부채(학자금, 카드값 등)가 고민이다=1

[multi]
마음 건강 — 나의 재고 상태는? (복수 선택)
지속적으로 무기력하다=1
수면 장애를 겪고 있다=1
감정 조절이 어렵다=1

[multi]
진로/취업 — 나의 재고 상태는? (복수 선택)
나의 적성을 잘 모르겠다=1
취업 정보에 접근하기 어렵다=1
구직을 포기한 상태이다=1

[multi]
정보 격차 — 나의 재고 상태는? (복수 선택)
정책 용어가 생소하다=1
신청 절차가 복잡하게 느껴진다=1
정책 수혜 경험이 없다=1
`;
