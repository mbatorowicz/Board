"use client";

import { useState } from "react";
import type { UserPublic, UserRole, SiteSettings } from "@/lib/types";
import AdminDialog from "@/components/admin/AdminDialog";
import CompactRow from "@/components/admin/CompactRow";
import CsrfFieldClient from "@/components/admin/CsrfFieldClient";
import { copy } from "@/lib/copy";
import {
  createUserAction,
  deleteUserAction,
  resetUserPinAction,
  saveUserLoginSettingsAction,
  updateUserRoleAction,
} from "@/app/admin/actions";
import ui from "@/styles/ui.module.css";
import styles from "@/app/admin/admin.module.css";

type ModalKind = "add" | "edit" | "loginMode" | null;

function isPrivilegedRole(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

function pinInputProps(role: UserRole) {
  if (isPrivilegedRole(role)) {
    return {
      inputMode: "text" as const,
      pattern: "[A-Za-z0-9]{8,32}",
      minLength: 8,
      maxLength: 32,
      autoComplete: "new-password" as const,
    };
  }
  return {
    inputMode: "numeric" as const,
    pattern: "[0-9]{4,6}",
    minLength: 4,
    maxLength: 6,
    autoComplete: "new-password" as const,
  };
}

export default function UsersPanel({
  users,
  settings,
  csrfToken,
}: {
  users: UserPublic[];
  settings: SiteSettings;
  csrfToken: string;
}) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [editUser, setEditUser] = useState<UserPublic | null>(null);
  const [newUserRole, setNewUserRole] = useState<UserRole>("reader");

  function openEdit(user: UserPublic): void {
    setEditUser(user);
    setModal("edit");
  }

  function closeModal(): void {
    setModal(null);
    setEditUser(null);
  }

  return (
    <section className={`${ui.surface} ${styles.card}`}>
      <div className={styles.sectionToolbar}>
        <h2 className={ui.sectionTitle}>{copy.admin.usersTitle}</h2>
        <div className={styles.sectionToolbarActions}>
          <button
            type="button"
            className={`${ui.button} ${ui.buttonGhost}`}
            onClick={() => setModal("loginMode")}
          >
            {copy.actions.loginSettings}
          </button>
          <button
            type="button"
            className={ui.button}
            onClick={() => setModal("add")}
          >
            {copy.actions.addUser}
          </button>
        </div>
      </div>
      <p className={ui.notice}>{copy.admin.usersHelp}</p>

      {users.length === 0 ? (
        <p className={ui.emptyPlain}>{copy.empty.users}</p>
      ) : (
        <div className={styles.compactList}>
          {users.map((user) => (
            <CompactRow
              key={user.id}
              label={user.name}
              meta={
                <span className={styles.roleBadge}>
                  {copy.roles[user.role as UserRole]}
                </span>
              }
              actions={
                <button
                  type="button"
                  className={`${ui.button} ${ui.buttonGhost}`}
                  onClick={() => openEdit(user)}
                >
                  {copy.actions.edit}
                </button>
              }
            />
          ))}
        </div>
      )}

      <AdminDialog
        open={modal === "add"}
        title={copy.actions.addUser}
        titleId="add-user-title"
        onClose={closeModal}
      >
        <form action={createUserAction} className={ui.form}>
          <CsrfFieldClient token={csrfToken} />
          <label className={ui.label}>
            {copy.labels.fullName}
            <input className={ui.input} type="text" name="name" required />
          </label>
          <label className={ui.label}>
            {copy.labels.role}
            <select
              className={ui.input}
              name="role"
              value={newUserRole}
              onChange={(event) =>
                setNewUserRole(event.target.value as UserRole)
              }
              required
            >
              <option value="reader">{copy.roles.reader}</option>
              <option value="editor">{copy.roles.editor}</option>
              <option value="admin">{copy.roles.admin}</option>
            </select>
          </label>
          <label className={ui.label}>
            {copy.labels.pin}
            <input
              className={ui.input}
              type="password"
              name="pin"
              {...pinInputProps(newUserRole)}
              required
            />
          </label>
          <button className={ui.button} type="submit">
            {copy.actions.addUser}
          </button>
        </form>
      </AdminDialog>

      <AdminDialog
        open={modal === "edit" && editUser !== null}
        title={editUser?.name ?? copy.actions.edit}
        titleId="edit-user-title"
        onClose={closeModal}
        wide
      >
        {editUser ? (
          <>
            <form action={updateUserRoleAction} className={ui.form}>
              <CsrfFieldClient token={csrfToken} />
              <input type="hidden" name="id" value={editUser.id} />
              <label className={ui.label}>
                {copy.labels.role}
                <select name="role" defaultValue={editUser.role} className={ui.input}>
                  <option value="reader">{copy.roles.reader}</option>
                  <option value="editor">{copy.roles.editor}</option>
                  <option value="admin">{copy.roles.admin}</option>
                </select>
              </label>
              <button className={ui.button} type="submit">
                {copy.actions.changeRole}
              </button>
            </form>

            <form action={resetUserPinAction} className={ui.form}>
              <CsrfFieldClient token={csrfToken} />
              <input type="hidden" name="id" value={editUser.id} />
              <label className={ui.label}>
                {copy.labels.newPin}
                <input
                  className={ui.input}
                  type="password"
                  name="pin"
                  {...pinInputProps(editUser.role)}
                  required
                />
              </label>
              <button className={ui.button} type="submit">
                {copy.actions.resetPin}
              </button>
            </form>

            <form action={deleteUserAction}>
              <CsrfFieldClient token={csrfToken} />
              <input type="hidden" name="id" value={editUser.id} />
              <button
                className={`${ui.button} ${ui.buttonDanger}`}
                type="submit"
              >
                {copy.actions.delete}
              </button>
            </form>
          </>
        ) : null}
      </AdminDialog>

      <AdminDialog
        open={modal === "loginMode"}
        title={copy.actions.loginSettings}
        titleId="login-mode-title"
        onClose={closeModal}
      >
        <form action={saveUserLoginSettingsAction} className={ui.form}>
          <CsrfFieldClient token={csrfToken} />
          <fieldset className={styles.loginModeFieldset}>
            <legend>{copy.admin.userLoginModeTitle}</legend>
            <label className={ui.checkboxLabel}>
              <input
                type="radio"
                name="userLoginMode"
                value="select"
                defaultChecked={settings.userLoginMode === "select"}
              />
              {copy.admin.userLoginModeSelect}
            </label>
            <label className={ui.checkboxLabel}>
              <input
                type="radio"
                name="userLoginMode"
                value="type"
                defaultChecked={settings.userLoginMode === "type"}
              />
              {copy.admin.userLoginModeType}
            </label>
          </fieldset>
          <button className={ui.button} type="submit">
            {copy.actions.save}
          </button>
        </form>
      </AdminDialog>
    </section>
  );
}
