import { create } from 'zustand';
import { subDays, format } from 'date-fns';

const useFilters = create((set) => ({
  // Filtros de período
  startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  periodo: 'mensal',
  
  // Filtros de contexto
  turmaId: null,
  modalidade: null,
  professorId: null,
  
  // Actions
  setDateRange: (start, end) => set({ startDate: start, endDate: end }),
  setPeriodo: (periodo) => {
    const periodMap = {
      semanal: 7,
      mensal: 30,
      trimestral: 90
    };
    const days = periodMap[periodo] || 30;
    set({
      periodo,
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    });
  },
  setTurmaId: (id) => set({ turmaId: id }),
  setModalidade: (modalidade) => set({ modalidade }),
  setProfessorId: (id) => set({ professorId: id }),
  reset: () => set({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    periodo: 'mensal',
    turmaId: null,
    modalidade: null,
    professorId: null
  })
}));

export default useFilters;

