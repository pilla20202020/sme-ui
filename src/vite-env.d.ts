/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SSO_LOGIN_URL?: string;
	readonly VITE_SSO_LOGOUT_URL?: string;
	readonly VITE_SSO_SITE_KEY?: string;
	readonly VITE_SSO_USER_INFO_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
