// Função para atualizar o estilo e adicionar o evento de clique dos cards de tarefas no Kanban

// Para o status TODO
const todoCards = document.querySelectorAll('.kanban-todo-card');
todoCards.forEach(card => {
  card.classList.add('cursor-pointer', 'hover:border-blue-300', 'transition-colors');
  card.addEventListener('click', () => {
    const taskId = card.dataset.taskId;
    window.location.href = `/tasks/${taskId}`;
  });
});