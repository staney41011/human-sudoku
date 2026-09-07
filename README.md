# 無獨有偶，有你有偶 — Human Sudoku

一款給大型實體活動使用的「真人邏輯矩陣」遊戲。玩家先用姓名、興趣、喜歡的顏色建立角色卡，再靠手機上的個人線索，在現場走動、詢問、討論，最後排成一個符合所有條件的真人正方形矩陣。

## 頁面

- `index.html`：入口頁
- `rules.html`：完整規則講解
- `player.html`：玩家登入與線索頁
- `leader.html`：主揪矩陣填答頁
- `screen.html`：投影畫面
- `admin.html`：主持人主控台

## 核心規則

- 人數 `N` 的矩陣邊長為 `ceil(sqrt(N))`。
- 多出的格子由中心優先挖空，例如 60 人使用 8×8，中央挖 4 格。
- 每位玩家有 4 條線索：2 條上下左右緊鄰、1 條同欄、1 條同列。
- 第一輪顯示「姓名」。
- 第二輪每條線索只顯示目標玩家的「興趣」或「喜歡的顏色」其中之一。
- 主揪送出後不是比對隱藏原圖，而是驗證目前矩陣是否滿足全體玩家的所有線索；符合者藍色、不符合者紅色。
- 第二輪重新洗牌人物，但沿用同一個正方形與挖空格位置。

## Firebase 設定

本專案使用 Firebase Anonymous Authentication + Realtime Database。

1. 建立 Firebase 專案。
2. 開啟 **Authentication → Sign-in method → Anonymous**。
3. 建立 **Realtime Database**。
4. 將 Firebase Web App 設定貼到 `firebase-config.js` 的 `firebaseConfig`。
5. 建議先用 `database.rules.json` 的活動版規則測試。

> 目前的權限模型適合現場活動，不是高安全性的公開服務。所有登入者都可連線到遊戲資料庫，主持人權限主要由前端角色流程限制。

## GitHub Pages

Repository 是純靜態網站，可直接使用 GitHub Pages 發佈。專案包含 `.github/workflows/pages.yml` 自動部署流程；若 Repository 尚未啟用 Pages，請到 Settings → Pages 將 Source 設為 GitHub Actions。

## Realtime Database 結構（概要）

```text
game/
  meta/
    phase
    joinLocked
    nextNumber
    matrixSize
    holes
    round
    leaderPlayerId
    introIndex
    introOrder
  players/{playerId}
  numberIndex/{number}
  rounds/1
  rounds/2
  recovery/{code}
```

## 測試建議

正式 60 人活動前，建議依序做 6 人、15 人、30 人壓力測試，再進行完整 60 人彩排。
