---
title: "Anomali Tespitiyle Sahtekarlık (Fraud) Önleme Sistemi"
description: "Gerçek zamanlı işlem verisinde anomali tespiti yaparak zararı minimize etmek."
publishDate: "2023-08-05T09:00:00Z"
industry: "Fintech"
services: ["Makine Öğrenimi", "Data Pipeline", "Node.js"]
tech: ["PostgreSQL", "Kafka", "Scikit-Learn", "Astro (Dashboard)"]
highlights:
  - "Yanlış pozitif oranında (False Positive) %40 azalma."
  - "Haftalık operasyon eforunun %60 oranında otomatize edilmesi."
  - "Ekip için gerçek zamanlı uyarı paneli geliştirilmesi."
draft: false
---

Hızlı büyüyen bir finans teknolojileri girişimi (Fintech - NDA), artan işlem hacmiyle birlikte sahtekarlık (fraud) vakalarının da yükseldiğini gördü. Manuel inceleme süreçleri artık sürdürülebilir değildi.

## Neler Yaptık?
Klasik kural tabanlı (rule-based) sistemlerin ötesine geçerek, geçmiş işlemlerin örüntülerini analiz eden denetimli (supervised) bir makine öğrenimi altyapısı kurduk. Model, bir işlemin fraud olma ihtimalini (score) canlı olarak hesaplamaya başladı. Yalnızca skoru yüksek, şüpheli işlemler analistlere düştü. Analistlerin işlerini hızlandırmak için hızlı, modern bir Astro gösterge paneli hazırladık.
