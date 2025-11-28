# Favicon設定ガイド

## 📋 概要

ウェブサイトのfavicon（ブラウザタブに表示されるアイコン）を設定する方法です。

## ✅ 現在の設定状況

- ✅ `app/icon.svg` - SVG形式のアイコン（作成済み）
- ⚠️ `public/icon.png` - PNG形式のアイコン（作成が必要）
- ⚠️ `public/favicon.ico` - ICO形式のfavicon（作成が必要）
- ⚠️ `public/apple-icon.png` - Apple Touch Icon（作成が必要）

## 🎨 アイコンのデザイン

現在、木のテーマに合わせたシンプルなアイコン（`app/icon.svg`）を作成しました。

## 📝 次のステップ

### 方法1: SVGからPNG/ICOを生成（推奨）

#### オンラインツールを使用

1. **SVG to PNG/ICO Converter**を使用:
   - [CloudConvert](https://cloudconvert.com/svg-to-png)
   - [Convertio](https://convertio.co/svg-png/)
   - [Online-Convert](https://www.online-convert.com/)

2. **必要なサイズ:**
   - `icon.png`: 32x32 ピクセル
   - `favicon.ico`: 16x16, 32x32, 48x48 ピクセル（複数サイズを含む）
   - `apple-icon.png`: 180x180 ピクセル

3. **変換手順:**
   - `app/icon.svg`をアップロード
   - 上記のサイズで変換
   - `public/`フォルダに配置

#### コマンドラインツールを使用（macOS）

```bash
# ImageMagickをインストール（未インストールの場合）
brew install imagemagick

# SVGからPNGを生成
convert -background none -resize 32x32 app/icon.svg public/icon.png
convert -background none -resize 180x180 app/icon.svg public/apple-icon.png

# SVGからICOを生成（複数サイズを含む）
convert -background none app/icon.svg -define icon:auto-resize=16,32,48 public/favicon.ico
```

### 方法2: デザインツールを使用

1. **Figma / Adobe Illustrator / Inkscape**で`app/icon.svg`を開く
2. 必要なサイズでエクスポート:
   - 32x32 → `public/icon.png`
   - 180x180 → `public/apple-icon.png`
   - 16x16, 32x32, 48x48 → `public/favicon.ico`

### 方法3: オンラインFaviconジェネレーターを使用

1. **Favicon Generator**を使用:
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [Favicon.io](https://favicon.io/)

2. **手順:**
   - `app/icon.svg`をアップロード
   - 必要なサイズを選択
   - 生成されたファイルをダウンロード
   - `public/`フォルダに配置

## 📁 ファイル配置

変換後、以下のようにファイルを配置してください:

```
public/
  ├── icon.png          (32x32)
  ├── favicon.ico       (16x16, 32x32, 48x48)
  └── apple-icon.png    (180x180)

app/
  └── icon.svg          (既に作成済み)
```

## 🔍 動作確認

1. **開発サーバーを起動:**
   ```bash
   npm run dev
   ```

2. **ブラウザで確認:**
   - ブラウザタブにアイコンが表示されるか確認
   - ブックマークアイコンが正しく表示されるか確認
   - モバイルデバイスでホーム画面アイコンが正しく表示されるか確認

3. **キャッシュクリア:**
   - ブラウザのキャッシュをクリア（Cmd+Shift+R / Ctrl+Shift+R）
   - または、シークレットモードで確認

## 🎨 カスタマイズ

アイコンのデザインを変更したい場合:

1. `app/icon.svg`を編集
2. 上記の手順でPNG/ICOを再生成
3. `public/`フォルダのファイルを更新

## 📚 参考資料

- [Next.js Metadata API - Icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
- [Favicon Generator](https://realfavicongenerator.net/)
- [SVG to PNG Converter](https://cloudconvert.com/svg-to-png)

## ⚠️ 注意事項

- `app/icon.svg`はNext.jsが自動的に認識しますが、ブラウザの互換性を考慮して`public/`フォルダにもPNG/ICOを配置することを推奨します
- `favicon.ico`は複数のサイズ（16x16, 32x32, 48x48）を含むことが推奨されます
- Apple Touch Icon（`apple-icon.png`）は180x180ピクセルが推奨サイズです

