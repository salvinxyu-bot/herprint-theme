# Herprint Stage 2 修改对比报告

日期：2026-07-16
状态：已发布，生产环境验收通过
线上主题：`Dawn - Stage 2 SEO QA 2026-07-16`（`154908491968`）
回滚主题：`Dawn`（`141871349952`，未发布）

## 1. 结论摘要

这次发布是一次严格限界的技术 SEO 修改。线上代码只涉及 4 个 Shopify
主题文件，源文件对比总计为 10 行新增、8 行删除。修改目标是让首页和产品页
拥有清晰、唯一、与页面主题一致的 H1，并避免页面标题因为品牌名大小写不同而
重复追加店铺名称。

本次没有修改可见文案、页面布局、CSS、商品数据、价格、变体、购物车逻辑、
GA4 代码或其他主题设置。SEO 收益来自页面语义结构更准确，不代表搜索排名会
立即或必然提升。

## 2. 修改总览

| 文件 | 修改前 | 修改后 | 主要作用 | 源码增删 |
| --- | --- | --- | --- | --- |
| `sections/header.liquid` | 首页 Logo 容器使用 H1 | 首页 Logo 容器使用 `div` | 避免把品牌 Logo 当作首页主标题 | +4 / -4 |
| `sections/herprint-eclat.liquid` | 首页现有 tagline 使用 `p` | 同一段 tagline 使用 H1 | 让首页可见核心主张成为唯一主标题 | +1 / -1 |
| `sections/main-product.liquid` | 产品名称使用 H2 | 产品名称使用 H1 | 让共享产品模板中的产品名称成为页面主标题 | +2 / -2 |
| `layout/theme.liquid` | 品牌后缀检查区分大小写 | 先转小写，再检查品牌后缀 | 避免 `Herprint` 与 `herprint` 大小写差异造成标题重复 | +3 / -1 |

按当前审计基线，这批共享模板修改预计处理约 97 个 H1 结构问题：主页 1 个，
产品页约 96 个。实际覆盖数量会随 Shopify 商品增删而变化。

## 3. 逐项前后对比

### 3.1 首页 Logo 不再占用 H1

文件：`sections/header.liquid`

修改前：

```liquid
<h1 class="header__heading">
  <a href="{{ routes.root_url }}" class="header__heading-link ...">
    ...
  </a>
</h1>
```

修改后：

```liquid
<div class="header__heading">
  <a href="{{ routes.root_url }}" class="header__heading-link ...">
    ...
  </a>
</div>
```

主题支持非居中和居中两种 Logo 位置，所以两个互斥的渲染分支都做了同样修改。
任一时刻只会渲染其中一个分支。Logo、链接、class 和视觉样式均保留，只改变
HTML 语义标签。

SEO 作用：搜索引擎不会再把 Logo 容器误当成首页最重要的内容标题。

### 3.2 首页现有 tagline 升级为唯一 H1

文件：`sections/herprint-eclat.liquid`

修改前：

```liquid
<p class="hp-eclat__tagline">{{ section.settings.tagline | escape }}</p>
```

修改后：

```liquid
<h1 class="hp-eclat__tagline">{{ section.settings.tagline | escape }}</h1>
```

线上实际 H1 为：

```text
Jewelry that marks your every becoming.
```

可见文字、模板变量、转义处理和 CSS class 均未改变。生产环境桌面端与移动端
截图确认没有可见布局回归。

SEO 作用：首页主标题现在对应访客真正看到的品牌主张，而不是 Logo。

### 3.3 产品名称从 H2 升级为 H1

文件：`sections/main-product.liquid`

修改前：

```liquid
<h2 style="font-size: 24px; line-height: 1.2;">
  {{ product.title | escape }}
</h2>
```

修改后：

```liquid
<h1 style="font-size: 24px; line-height: 1.2;">
  {{ product.title | escape }}
</h1>
```

产品名称、字号、行高、转义处理和外层容器全部保留。因为这是共享产品模板，
修改会自动应用于使用该模板的产品页，不需要逐个编辑商品。

SEO 作用：每个产品页的产品名称成为清晰的页面主标题，提升页面主题与搜索意图
之间的一致性。

### 3.4 页面标题品牌检查改为大小写不敏感

文件：`layout/theme.liquid`

修改前：

```liquid
{%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
```

修改后：

```liquid
{%- assign page_title_downcase = page_title | downcase -%}
{%- assign shop_name_downcase = shop.name | downcase -%}
{%- unless page_title_downcase contains shop_name_downcase %} &ndash; {{ shop.name }}{% endunless -%}
```

原逻辑区分大小写，因此标题中的 `Herprint` 可能无法匹配店铺名 `herprint`，
从而再次追加品牌后缀。新逻辑只在比较时转为小写，最终输出的标题和店铺名本身
不会被强制改成小写。

SEO 作用：减少重复品牌后缀，保持 title 简洁，并降低搜索结果标题被截断的风险。

## 4. 用户可见变化与未变化内容

用户可见文字没有改变。正常访问时，访客看到的 Logo、首页 tagline、产品名称、
价格、按钮和布局应与发布前一致；变化主要存在于页面源代码和搜索引擎读取的
标题层级中。

明确未修改：

- 首页或产品页可见文案
- CSS、字号、颜色、间距和响应式布局
- 产品标题数据、描述、图片、价格和变体
- canonical 与 Product JSON-LD 生成逻辑
- Add to cart、购物车抽屉和结账逻辑
- GA4 衡量 ID 或分析代码
- 导航、菜单、市场、支付或其他主题设置

## 5. 生产环境验收结果

- 真正线上模式已确认，没有 Shopify 预览栏。
- 首页桌面端 `1440 x 900`：通过。
- 首页移动端 `390 x 844`：通过。
- 首页唯一 H1、title、meta description、canonical 和 GA4：通过。
- 戒指、项链、耳环、手链四类样本：唯一产品 H1、self-canonical、Product JSON-LD、价格、币种与库存状态全部通过。
- Add to cart 与购物车抽屉：通过。
- 生产结账页面成功打开并渲染联系、配送、运输和支付区域。
- 未输入客户或支付信息，未产生购买，测试商品已从购物车移除。
- 发布后重新拉取 4 个线上文件，与批准版本逐字节一致。

## 6. 风险与回滚

综合风险评估：低。

原因：修改范围小；没有数据迁移；没有 JavaScript、CSS、商品或交易逻辑变化；
发布前后均完成文件完整性检查和浏览器验收。

如需回滚，可重新发布原 Dawn 主题 `141871349952`。本次所有生产测试均通过，
因此没有执行回滚。

## 7. 记录位置

- 技术提案：`reports/proposals/2026-07-11-theme-h1/`
- 生产发布记录：`reports/proposals/2026-07-11-theme-h1/RELEASE.md`
- 机器可读生产测试：`reports/proposals/2026-07-11-theme-h1/evidence/production-smoke.json`
- 主题提案提交：`7ddc3fb`
- 生产发布记录提交：`d871c81`
- SEO 发布记录提交：`eb568af`
