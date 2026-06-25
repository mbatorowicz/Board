"use client";

import { useState } from "react";
import type { User, UserLoginMode } from "@/lib/types";
import { loginUserAction, logoutUserAction } from "@/app/user-session";
import AdminDialog from "@/components/admin/AdminDialog";
import { copy } from "@/lib/copy";
import ui from "@/styles/ui.module.css";
import styles from "./components.module.css";

export default function UserSessionBar({
  currentUser,
  loginMode,
  selectableUsers,
}: {
  currentUser: User | null;
  loginMode: UserLoginMode;
  selectableUsers: Pick<User, "id" | "name">[];
}) {
  const [loginOpen, setLoginOpen] = useState(false);

  if (currentUser) {
    return (
      <div className={styles.userSession}>
        <span className={styles.userSessionName}>
          {copy.userSession.loggedInAs(currentUser.name)}
        </span>
        <form action={logoutUserAction}>
          <button
            className={`${ui.button} ${ui.buttonGhost} ${styles.userSessionBtn}`}
            type="submit"
          >
            {copy.actions.logout}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`${ui.button} ${styles.userSessionBtn}`}
        onClick={() => setLoginOpen(true)}
      >
        {copy.actions.login}
      </button>

      <AdminDialog
        open={loginOpen}
        title={copy.actions.login}
        titleId="login-dialog-title"
        onClose={() => setLoginOpen(false)}
      >
        <form action={loginUserAction} className={ui.form}>
          {loginMode === "select" ? (
            <label className={ui.label}>
              {copy.labels.fullName}
              <select
                className={ui.input}
                name="userId"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  {copy.userSession.selectUser}
                </option>
                {selectableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className={ui.label}>
              {copy.labels.fullName}
              <input
                className={ui.input}
                type="text"
                name="name"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                required
              />
            </label>
          )}
          <label className={ui.label}>
            {copy.labels.pin}
            <input
              className={ui.input}
              type="password"
              name="pin"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]{4,6}"
              minLength={4}
              maxLength={6}
              required
            />
          </label>
          <button className={ui.button} type="submit">
            {copy.actions.login}
          </button>
        </form>
      </AdminDialog>
    </>
  );
}
