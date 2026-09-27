/**
 * @file confirm-sheet.jsx
 * @description Uygulama genelinde window.confirm() yerine kullanılan,
 * ekranın ortasında/üstünde açılan genel onay modalı.
 *
 * @notes
 * - Sadece "Görünüm"den sorumludur; state yönetimi src/hooks/useConfirm.js içinde.
 */

import React from 'react';
import PropTypes from 'prop-types';

const ConfirmSheet = ({
    open,
    title,
    message,
    confirmLabel,
    cancelLabel,
    danger,
    checkbox,
    onConfirm,
    onCancel,
}) => {
    return (
        <div className={`fixed inset-0 z-[70] flex items-start justify-center pt-24 px-4 transition-all duration-200 ${open ? 'visible' : 'invisible pointer-events-none'}`}>

            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={onCancel}
            />

            {/* Modal Card */}
            <div
                className={`relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] w-full max-w-sm transform transition-all duration-200 ease-out ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <div className="px-6 pt-6 pb-6">
                    <h2 className="text-lg font-bold text-slate-800 font-['Ubuntu'] mb-2">{title}</h2>

                    {message && (
                        <p className="text-sm text-slate-500 font-['Ubuntu'] leading-relaxed mb-4 whitespace-pre-line">
                            {message}
                        </p>
                    )}

                    {checkbox && (
                        <label className="flex items-center gap-3 py-3 px-4 mb-2 bg-slate-50 rounded-xl cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={checkbox.checked}
                                onChange={(e) => checkbox.onChange(e.target.checked)}
                                className="w-5 h-5 accent-red-500 rounded shrink-0"
                            />
                            <span className="text-sm font-medium text-slate-700 font-['Ubuntu']">{checkbox.label}</span>
                        </label>
                    )}

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors font-['Ubuntu']"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors font-['Ubuntu'] ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-900'}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

ConfirmSheet.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    danger: PropTypes.bool,
    checkbox: PropTypes.shape({
        label: PropTypes.string.isRequired,
        checked: PropTypes.bool.isRequired,
        onChange: PropTypes.func.isRequired,
    }),
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

ConfirmSheet.defaultProps = {
    title: '',
    message: '',
    confirmLabel: 'Sil',
    cancelLabel: 'Vazgeç',
    danger: true,
    checkbox: undefined,
};

export default ConfirmSheet;
