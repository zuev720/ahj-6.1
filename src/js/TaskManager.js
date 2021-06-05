export default class TaskManager {
  constructor(elem) {
    if (typeof elem === 'string') {
      this.container = document.querySelector(elem);
    }
    this.container = elem;

    this.storage = {
      todo: [],
      inProgress: [],
      done: [],
    };

    this.init();
    this.drawTasks();

    this.draggedEl = null;
    this.ghostEl = null;
    this.shiftX = null;
    this.shiftY = null;
  }

  init() {
    this.container.addEventListener('mousedown', (e) => this.onCardMouseDown(e));
    this.container.addEventListener('mousemove', (e) => this.onCardMouseMove(e));
    this.container.addEventListener('mouseup', (e) => this.onCardMouseUp(e));
    this.container.addEventListener('mouseleave', (e) => TaskManager.onCardMouseLeave(e));

    this.buttonAddTasks = this.container.querySelectorAll('.add-task-text');
    this.buttonsForm = this.container.querySelectorAll('.form-button');
    this.buttonsFormHide = this.container.querySelectorAll('.form-button-hide');
    this.buttonsTasksHide = this.container.querySelectorAll('.hide-tasks-block');
    this.textAreas = this.container.querySelectorAll('.text-area');

    [...this.buttonsForm].forEach((button) => button.addEventListener('click', (e) => this.onClickFormButton(e)));
    [...this.buttonAddTasks].forEach((element) => element.addEventListener('click', (e) => TaskManager.onClickAddTask(e)));
    [...this.textAreas].forEach((button) => button.addEventListener('keydown', (e) => TaskManager.onClickTextArea(e)));
    [...this.buttonsFormHide].forEach((button) => button.addEventListener('click', (e) => TaskManager.onClickFormButtonHide(e)));
    [...this.buttonsTasksHide].forEach((button) => button.addEventListener('click', (e) => TaskManager.onClickTasksHideButton(e)));
  }

  drawTasks() {
    const storage = JSON.parse(localStorage.getItem('storage'));
    if (storage === null) return;
    Object.keys(storage).forEach((key) => {
      const tasksColumn = this.container.querySelectorAll('.task-column');
      [...tasksColumn].forEach((column) => {
        if (column.dataset.type === key) {
          const contentBlock = column.querySelector('.task-content-block');
          contentBlock.innerHTML = '';
          storage[key].forEach((task) => {
            contentBlock.innerHTML += `
      <div class="task-container-block">
        <div class="task">${task}</div>
        <button class="task-delete">&#10006</button>
      </div>
      `;
            const cards = contentBlock.querySelectorAll('.task-container-block');
            [...cards].forEach((card) => {
              card.addEventListener('mouseover', (e) => TaskManager.onMouseEnterCards(e));
              card.addEventListener('mouseout', (e) => TaskManager.onMouseOutCards(e));
            });
          });
        }
      });
    });
  }

  onCardMouseDown(e) {
    e.preventDefault();
    if (e.target.classList.contains('task-delete')) {
      this.deleteTask(e.target.closest('.task-container-block'));
      return;
    }
    if (!e.target.classList.contains('task-container-block') && !e.target.closest('.task-container-block')) return;
    this.draggedEl = (!e.target.classList.contains('task-container-block')) ? e.target.closest('.task-container-block') : e.target;
    this.ghostEl = this.draggedEl.cloneNode(true);

    this.shiftX = e.clientX - this.draggedEl.getBoundingClientRect().left;
    this.shiftY = e.clientY - this.draggedEl.getBoundingClientRect().top;
    this.ghostEl.classList.add('dragged');

    this.ghostEl.style.width = `${this.draggedEl.getBoundingClientRect().width}px`;
    this.ghostEl.style.height = `${this.draggedEl.getBoundingClientRect().height}px`;

    this.ghostEl.style.left = `${e.pageX - this.shiftX}px`;
    this.ghostEl.style.top = `${e.pageY - this.shiftY - this.draggedEl.offsetHeight}px`;

    this.deleteTask(this.draggedEl);
    document.body.appendChild(this.ghostEl);
    e.currentTarget.style.cursor = 'grabbing';
  }

  onCardMouseMove(e) {
    e.preventDefault();
    if (!this.draggedEl) return;
    this.ghostEl.style.left = `${e.pageX - this.shiftX}px`;
    this.ghostEl.style.top = `${e.pageY - this.shiftY - this.ghostEl.offsetHeight}px`;
    document.body.appendChild(this.ghostEl);
    e.currentTarget.style.cursor = 'grabbing';

    const currentDroppable = (document.elementFromPoint(e.clientX, e.clientY).closest('.task-content-block'))
      ? document.elementFromPoint(e.clientX, e.clientY).closest('.task-content-block') : null;

    if (currentDroppable) currentDroppable.style.border = '#36afcc dashed 2px';
    else {
      this.findAndDeleteBorder();
    }
  }

  static onCardMouseLeave(e) {
    e.currentTarget.style.cursor = '';
  }

  onCardMouseUp(e) {
    e.preventDefault();
    if (!this.draggedEl || !e.target.closest('.task-content-block')) return;

    let closest = null;
    if (document.elementFromPoint(e.clientX, e.clientY).classList.contains('.task-container-block')) {
      closest = document.elementFromPoint(e.clientX, e.clientY);
      const { top } = closest.getBoundingClientRect();
      if (e.pageY > window.scrollY + top + closest.offsetHeight / 2) {
        e.target.insertBefore(this.draggedEl, closest.nextElementSibling);
      } else {
        e.target.insertBefore(this.draggedEl, closest);
      }
    }
    if (document.elementFromPoint(e.clientX, e.clientY).closest('.task-container-block')) {
      closest = document.elementFromPoint(e.clientX, e.clientY).closest('.task-container-block');
      const { top } = closest.getBoundingClientRect();
      if (e.pageY > window.scrollY + top + closest.offsetHeight / 2) {
        e.target.insertBefore(this.draggedEl, closest.nextElementSibling);
      } else {
        e.target.insertBefore(this.draggedEl, closest);
      }
    }

    if (document.elementFromPoint(e.clientX, e.clientY).className === 'task-content-block') {
      e.target.insertAdjacentElement('beforeend', this.draggedEl);
    }

    const { type } = e.target.closest('.task-column').dataset;
    const storage = JSON.parse(localStorage.getItem('storage'));
    storage[type] = [];
    [...e.target.closest('.task-column').querySelectorAll('.task')]
      .reduce((arr, task) => {
        arr.push(task.textContent);
        return arr;
      }, storage[type]);

    localStorage.setItem('storage', JSON.stringify(storage));
    document.body.removeChild(this.ghostEl);
    this.draggedEl = null;
    this.ghostEl = null;
    this.shiftX = null;
    this.shiftY = null;
    e.currentTarget.style.cursor = '';
    this.findAndDeleteBorder();
  }

  static onClickAddTask(e) {
    const button = e.target;
    button.style.display = 'none';
    button.previousElementSibling.style.display = 'block';
    e.target.previousElementSibling.querySelector('.text-area').focus();
  }

  deleteTask(element) {
    const task = element.querySelector('.task').textContent;
    const { type } = element.closest('.task-column').dataset;
    const storage = JSON.parse(localStorage.getItem('storage'));
    storage[type].forEach((elem, index) => {
      if (elem.toLowerCase() === task.toLowerCase()) storage[type].splice(index, 1);
    });
    localStorage.setItem('storage', JSON.stringify(storage));
    this.drawTasks();
  }

  static onMouseEnterCards(e) {
    e.currentTarget.querySelector('.task-delete').style.display = 'block';
  }

  static onMouseOutCards(e) {
    e.currentTarget.querySelector('.task-delete').style.display = 'none';
  }

  static onClickTextArea(e) {
    if (e.key === 'Enter') {
      const event = new Event('click');
      e.target.nextElementSibling.querySelector('.form-button').dispatchEvent(event);
    }
  }

  onClickFormButton(e) {
    e.preventDefault();
    const textarea = e.target.closest('.wrapper-buttons-form').previousElementSibling;
    if (textarea.value === '') return;
    const storageObject = JSON.parse(localStorage.getItem('storage'));
    const { type } = e.target.closest('.task-column').dataset;

    if (storageObject === null || storageObject[type] === null) {
      this.storage[e.target.closest('.task-column').dataset.type].push(textarea.value);
      localStorage.setItem('storage', JSON.stringify(this.storage));
    } else {
      storageObject[e.target.closest('.task-column').dataset.type].push(textarea.value);
      localStorage.setItem('storage', JSON.stringify(storageObject));
    }
    textarea.value = '';
    e.target.closest('form').style.display = 'none';
    e.target.closest('form').nextElementSibling.style.display = 'block';
    this.drawTasks();
  }

  static onClickFormButtonHide(e) {
    e.preventDefault();
    e.target.closest('.wrapper-buttons-form').previousElementSibling.value = '';
    e.target.closest('form').style.display = 'none';
    e.target.closest('form').nextElementSibling.style.display = 'block';
  }

  static onClickTasksHideButton(e) {
    const tasksBlock = e.target.closest('.header-task-column-block').nextElementSibling;
    if (!tasksBlock.classList.contains('task-content-block-none')) {
      tasksBlock.classList.add('task-content-block-none');
    } else {
      tasksBlock.classList.remove('task-content-block-none');
    }
  }

  findAndDeleteBorder() {
    [...this.container.querySelectorAll('.task-content-block')]
      .forEach((elem) => {
        const block = elem;
        block.style.border = 'none';
      });
  }
}
