/**
 * @file useConfirm.js
 * @description window.confirm() yerine geçen, Promise tabanlı onay hook'u.
 * Kullanım window.confirm ile aynı sadelikte kalır:
 *
 *   const { confirmed, checkboxChecked } = await confirm({
 *       title: "Gönderiyi sil",
 *       message: "Emin misiniz?",
 *       checkboxLabel: "Görselleri de sil", // opsiyonel
 *   });
 *   if (!confirmed) return;
 *
 * <ConfirmSheet {...sheetProps} /> bileşeni sayfada bir kez render edilir.
 */

import { useCallback, useRef, useState } from 'react';

const DEFAULTS = {
    title: '',
    message: '',
    confirmLabel: 'Sil',
    cancelLabel: 'Vazgeç',
    danger: true,
    checkboxLabel: null,
};

export function useConfirm() {
    const [sheet, setSheet] = useState({ open: false, ...DEFAULTS });
    const [checkboxChecked, setCheckboxChecked] = useState(false);
    const resolveRef = useRef(null);

    const confirm = useCallback((options) => {
        setCheckboxChecked(false);
        setSheet({ open: true, ...DEFAULTS, ...options });
        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setSheet((s) => ({ ...s, open: false }));
        resolveRef.current?.({ confirmed: true, checkboxChecked });
    }, [checkboxChecked]);

    const handleCancel = useCallback(() => {
        setSheet((s) => ({ ...s, open: false }));
        resolveRef.current?.({ confirmed: false, checkboxChecked });
    }, [checkboxChecked]);

    const sheetProps = {
        open: sheet.open,
        title: sheet.title,
        message: sheet.message,
        confirmLabel: sheet.confirmLabel,
        cancelLabel: sheet.cancelLabel,
        danger: sheet.danger,
        checkbox: sheet.checkboxLabel
            ? { label: sheet.checkboxLabel, checked: checkboxChecked, onChange: setCheckboxChecked }
            : undefined,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
    };

    return { confirm, sheetProps };
}
