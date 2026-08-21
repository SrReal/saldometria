import Swal from 'sweetalert2';

/**
 * Instancia preconfigurada de SweetAlert2 con la paleta y estilos de SaldoMetria.
 */
const customSwal = Swal.mixin({
    customClass: {
        popup: 'rounded-2xl border border-slate-200 shadow-xl font-sans',
        title: 'text-lg font-bold text-slate-800',
        htmlContainer: 'text-sm text-slate-600',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-[#ff8404] hover:bg-[#e67600] text-white shadow-md transition-all mx-1.5 focus:outline-none',
        cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all mx-1.5 focus:outline-none',
        denyButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all mx-1.5 focus:outline-none',
    },
    buttonsStyling: false,
    focusConfirm: false,
    reverseButtons: true,
});

/**
 * Muestra un diálogo de confirmación asíncrono estilizado.
 * Devuelve true si el usuario confirma, false si cancela o cierra.
 */
export const showConfirm = async ({
    title = '¿Estás seguro?',
    text = '',
    confirmButtonText = 'Confirmar',
    cancelButtonText = 'Cancelar',
    icon = 'warning',
    isDanger = false,
} = {}) => {
    const result = await customSwal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        customClass: {
            popup: 'rounded-2xl border border-slate-200 shadow-xl font-sans',
            title: 'text-lg font-bold text-slate-800',
            htmlContainer: 'text-sm text-slate-600',
            confirmButton: isDanger
                ? 'px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all mx-1.5 focus:outline-none'
                : 'px-5 py-2.5 rounded-xl font-bold text-sm bg-[#ff8404] hover:bg-[#e67600] text-white shadow-md shadow-[#ff8404]/20 transition-all mx-1.5 focus:outline-none',
            cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all mx-1.5 focus:outline-none',
        },
    });

    return result.isConfirmed;
};

/**
 * Muestra un mensaje informativo o de éxito/error.
 */
export const showAlert = async ({
    title = '',
    text = '',
    icon = 'info',
    confirmButtonText = 'Entendido',
} = {}) => {
    return customSwal.fire({
        title,
        text,
        icon,
        confirmButtonText,
    });
};

export default customSwal;
