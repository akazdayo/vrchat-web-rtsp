# AGENTS.md

## 対象ディレクトリ
- 主なアプリは `web/vrchat-web-rtsp` にあります。
- 以降のコマンドは基本的に `web/vrchat-web-rtsp` で実行します。
- ルート直下の `dist` はビルド成果物として扱います。

## プロジェクト概要
- Vite + TanStack Router/Start + React + TypeScript のフロントエンド。
- Tailwind CSS を利用。
- Cloudflare/Vite プラグインと `wrangler` を使用。
- Bun を前提としたスクリプト構成。

## 事前準備
- 依存関係のインストール: `bun install`
- Node/Bun 実行環境が必要。
- `node_modules` は基本的に更新不要。

## 開発コマンド
- 開発サーバ: `bun --bun run dev`
- ビルド: `bun --bun run build`
- プレビュー: `bun --bun run preview`
- デプロイ: `bun --bun run deploy`

## テスト
- 全テスト実行: `bun --bun run test`
- 単一ファイル: `bun --bun run test -- src/routes/index.test.tsx`
- テスト名指定: `bun --bun run test -- -t "test name"`
- 監視なしの実行: `vitest run`（`bun --bun run test` と同等）
- テストは `@testing-library/react` を前提に整理。
- `*.test.tsx`/`*.test.ts` の命名を守る。

## リント/フォーマット
- リント: `bun --bun run lint`
- フォーマット: `bun --bun run format`
- 一括チェック: `bun --bun run check`
- Biome が `imports` を自動整形する前提。
- `biome.json` の対象外ファイルは無理に整形しない。

## 主要ディレクトリ
- `src/routes`: TanStack Router のルート。
- `src/components`: UI コンポーネント。
- `src/lib`: 汎用ユーティリティ。
- `src/integrations`: 連携系（TanStack Query 等）。
- `src/data`: 参照データやサンプル。

## ルーティング規約
- ルートは `src/routes` のファイル追加で定義。
- ルートは `createFileRoute` を使用。
- 共有レイアウトは `src/routes/__root.tsx`。
- ルートのコンポーネントは named export を優先。

## データ取得/SSR
- ルートのデータ取得は TanStack Router の `loader` を活用。
- TanStack Query 連携は `src/integrations` に集約。
- SSR/SPA 関連の設定は `routes/demo` を参考にする。

## インポート規約
- 可能な限り `@/` エイリアスで `src` 配下を参照。
- 相対パスは同一ディレクトリ内でのみ使用。
- Biome の organizeImports に合わせて並び替え。
- 副作用インポートは最小限。
- 同種の import はまとめて整理。

## フォーマット規約
- インデントはタブ。
- 文字列はダブルクオート。
- セミコロンを付ける。
- 末尾カンマは Biome に任せる。
- 1行が長くなりすぎる場合は適切に改行。

## TypeScript 規約
- `strict: true` 前提。
- `any` は避け、型注釈は必要な場面のみ。
- 非同期処理は `async/await` を優先。
- 型は `PascalCase`、値は `camelCase`。
- パスエイリアスは `@/*` を使用。

## React/JSX 規約
- コンポーネント名は `PascalCase`。
- ルートコンポーネントは `function` で定義するスタイルに合わせる。
- Hooks はロジック順に並べる（`useState` → `useMemo` など）。
- JSX 内の条件分岐は可読性優先で整理。
- JSX の class 連結は `cn` を利用。

## 実装ガイド
- 新規 UI コンポーネントは `src/components` に配置。
- 汎用ロジックは `src/lib` に移動して再利用。
- Tailwind のクラスを優先し、CSS 追加は最小限。
- クラス結合や条件分岐は `cn` で統一。
- 画面単位の状態はローカル state で管理。
- 共有状態が必要なら TanStack Query/Store を検討。
- `const` を基本とし、`let` は必要最小限。
- 1文字変数は避け、意味のある命名を行う。

## 命名規約
- 関数/変数: `camelCase`。
- コンポーネント/型: `PascalCase`。
- ルートファイル名は既存命名に合わせる。
- テストは `*.test.tsx`/`*.test.ts`。
- 定数は必要に応じて `UPPER_SNAKE_CASE`。

## エラーハンドリング
- UI 操作は `try/catch` で失敗時の状態を明示。
- 例外を握りつぶさず、ユーザー向けフィードバックを返す。
- 非同期エラーは `catch` でログ/状態更新。
- ユーザー通知は UI で完結させる方針。

## スタイル/デザイン
- Tailwind CSS を利用。
- `cn` ユーティリティ（`src/lib/utils.ts`）でクラス結合。
- 既存 UI と整合するクラス名を優先。
- グリッド/フレックス構成は既存パターンを尊重。

## 副作用/ユーティリティ
- 共有ロジックは `src/lib` へ配置。
- クリップボード等の副作用はユーティリティで切り出す。
- DOM 直接操作は必要最小限。

## 生成ファイル
- `src/routeTree.gen.ts` は自動生成なので編集禁止。
- Biome の対象外に指定されているファイルは触らない。
- `dist` は出力のみなので編集しない。

## 変更時のチェックリスト
- 新規ルート追加時は `src/routes` の構成を確認。
- インポート順と `@/` エイリアスを確認。
- Biome でフォーマット/リントが通ること。
- ルーティングの生成ファイルを直接触らない。

## 便利な実行例
- ルート修正後のチェック: `bun --bun run check`
- 特定テストのみ: `bun --bun run test -- src/lib/utils.test.ts`
- テスト名で指定: `bun --bun run test -- -t "Clipboard"`
- ビルド検証: `bun --bun run build`

## 既知の前提
- 依存管理は Bun。
- `node_modules` が既にリポジトリに存在するが、通常は更新不要。
- `src/styles.css` は Biome 対象外。

## 参考ファイル
- `web/vrchat-web-rtsp/README.md` に基本コマンドあり。
- `web/vrchat-web-rtsp/biome.json` にフォーマット設定あり。
- `web/vrchat-web-rtsp/tsconfig.json` に型・パス設定あり。
- `web/vrchat-web-rtsp/vite.config.ts` にビルド設定あり。
