# GitHub認証設定

GitHubへのプッシュには認証が必要です。以下のいずれかの方法で認証を設定してください。

## 方法1: Personal Access Token (PAT) を使用（推奨）

### 1. GitHubでPersonal Access Tokenを作成

1. https://github.com/settings/tokens にアクセス
2. 「Generate new token」→「Generate new token (classic)」をクリック
3. 以下の設定を行う：
   - **Note**: `RikkyoAI Deploy`（任意の名前）
   - **Expiration**: 適切な期間を選択（例: 90 days）
   - **Scopes**: `repo` にチェック（リポジトリへのアクセス権限）
4. 「Generate token」をクリック
5. **表示されたトークンをコピー**（後で表示されません）

### 2. リモートURLを更新してトークンを使用

```bash
cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"

# リモートURLを更新（YOUR_TOKENを実際のトークンに置き換え）
git remote set-url origin https://YOUR_TOKEN@github.com/suzutaku6311-eng/RikkyoAI.git

# プッシュ
git push -u origin main
```

または、プッシュ時にトークンを入力：

```bash
git push -u origin main
# Username: suzutaku6311-eng
# Password: YOUR_TOKEN（Personal Access Token）
```

## 方法2: SSH鍵を使用

### 1. SSH鍵を生成（まだの場合）

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. SSH鍵をGitHubに追加

1. 公開鍵をコピー：
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

2. https://github.com/settings/keys にアクセス
3. 「New SSH key」をクリック
4. コピーした公開鍵を貼り付け
5. 「Add SSH key」をクリック

### 3. リモートURLをSSHに変更

```bash
cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"

git remote set-url origin git@github.com:suzutaku6311-eng/RikkyoAI.git

git push -u origin main
```

## 方法3: GitHub CLIを使用

```bash
# GitHub CLIをインストール（まだの場合）
brew install gh

# GitHubにログイン
gh auth login

# プッシュ
git push -u origin main
```

## 推奨方法

**方法1（Personal Access Token）**が最も簡単です。トークンを作成したら、以下のコマンドでプッシュできます：

```bash
cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"
git push -u origin main
# Username: suzutaku6311-eng
# Password: YOUR_PERSONAL_ACCESS_TOKEN
```











