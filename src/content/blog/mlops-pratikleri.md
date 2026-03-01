---
title: "Makine Öğrenimi Modellerini Yönetmek: MLOps Pratikleri"
description: "Model geliştirmekten daha zor olan bir şey varsa o da bu modelleri sürdürülebilir bir şekilde canlıda tutmaktır."
publishDate: "2024-02-15T09:00:00Z"
tags: ["MLOps", "Engineering", "Data Science"]
draft: false
---

Modelinizi eğittiniz, metrikleriniz harika görünüyor. Peki ya sonra? Canlı ortamda veri dağılımları değiştiğinde modeliniz eskimeye başlayacak (Data Drift & Concept Drift).

MLOps, yazılım mühendisliğindeki DevOps pratiklerinin makine öğrenimi projelerine uyarlanmasıdır. Bir modeli sadece "Jupyter Notebook" seviyesinden çıkarıp, otomatik olarak eğitilebilen, test edilebilen ve paketlenerek sunuma alınabilen bir yapıya kavuşturmaktır.

## Sürekli Entegrasyon ve Dağıtım (CI/CD)
Model eğitim kodlarını version kontrol sistemine almak yetmez. Veriyi de versiyonlamak (DVC kullanarak) gerekir. Veritabanlarına bağlanan job'lar, model kalitesini düzenli olarak kontrol etmeli ve metriklerde düşüş olduğunda ekibi uyarmalıdır.

AKA Software, veri bilimcilerinizin geliştirdiği değerli modelleri, mühendislik standartlarına tam uyumlu bir şekilde üretime alır.
