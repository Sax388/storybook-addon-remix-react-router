/**
 * Credits : https://github.com/remix-run/react-router
 * reactrouter.com
 */

import React from "react";
import {
  ActionFunctionArgs,
  Form,
  Link,
  LoaderFunctionArgs,
  Outlet,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams
} from "react-router-dom";
import {StoryRouteTree} from "../../../src/components/StoryRouteTree";

export default {
  component: StoryRouteTree,
};

function sleep(n: number = 500) {
  return new Promise((r) => setTimeout(r, n));
}

interface Todos {
  [key: string]: string;
}

const TODOS_KEY = "todos";

const uuid = () => Math.random().toString(36).substr(2, 9);

function saveTodos(todos: Todos): void {
  return localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

function initializeTodos(): Todos {
  let todos: Todos = new Array(3)
    .fill(null)
    .reduce(
      (acc, _, index) =>
        Object.assign(acc, { [uuid()]: `Seeded Todo #${index + 1}` }),
      {}
    );
  saveTodos(todos);
  return todos;
}

function getTodos(): Todos {
  const todosFromStorage = localStorage.getItem(TODOS_KEY);

  if (todosFromStorage === null) {
    return initializeTodos();
  }

  return JSON.parse(todosFromStorage);
}

function addTodo(todo: string): void {
  let newTodos = { ...getTodos() };
  newTodos[uuid()] = todo;
  saveTodos(newTodos);
}

function deleteTodo(id: string): void {
  let newTodos = { ...getTodos() };
  delete newTodos[id];
  saveTodos(newTodos);
}

function resetTodos(): void {
  localStorage.removeItem(TODOS_KEY);
  initializeTodos();
}

async function todoListAction({ request }: ActionFunctionArgs) {
  await sleep();

  let formData = await request.formData();

  // Deletion via fetcher
  if (formData.get("action") === "delete") {
    let id = formData.get("todoId");
    if (typeof id === "string") {
      deleteTodo(id);
      return { ok: true };
    }
  }

  // Addition via <Form>
  let todo = formData.get("todo");
  if (typeof todo === "string") {
    addTodo(todo);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: "/todos" },
  });
}

async function todoListLoader(): Promise<Todos> {
  await sleep(100);
  return getTodos();
}

function TodosList() {
  let todos = useLoaderData() as Todos;
  let navigation = useNavigation();
  let formRef = React.useRef<HTMLFormElement>(null);

  // If we add and then we delete - this will keep isAdding=true until the
  // fetcher completes it's revalidation
  let [isAdding, setIsAdding] = React.useState(false);
  React.useEffect(() => {
    if (navigation.formData?.get("action") === "add") {
      setIsAdding(true);
    } else if (navigation.state === "idle") {
      setIsAdding(false);
      formRef.current?.reset();
    }
  }, [navigation]);

  const items = Object.entries(todos).map(([id, todo]) => (
    <li key={id}>
      <TodoListItem id={id} todo={todo} />
    </li>
  ));

  return (
    <>
      <h1>Todos</h1>
      <ul>
        <li>
          <Link to="/todos/junk">Click to trigger error</Link>
        </li>
        {items}
      </ul>
      <Form method="post" ref={formRef}>
        <input type="hidden" name="action" value="add" />
        <input name="todo"></input>
        <button type="submit" disabled={isAdding}>
          {isAdding ? "Adding..." : "Add"}
        </button>
      </Form>
      <Outlet />
    </>
  );
}

interface TodoItemProps {
  id: string;
  todo: string;
}

function TodoListItem({ id, todo }: TodoItemProps) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.formData != null;

  return (
    <>
      <Link to={id}>{todo}</Link>
      <fetcher.Form method="post">
        <input type="hidden" name="action" value="delete" />
        <button type="submit" name="todoId" value={id} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </fetcher.Form>
    </>
  );
}

function Todo() {
  let params = useParams();
  let todo = useLoaderData() as string;
  return (
    <>
      <h2>Todo:</h2>
      <p>id: {params.id}</p>
      <p>title: {todo}</p>
    </>
  );
}

async function todoLoader({ params }: LoaderFunctionArgs) {
  await sleep();
  let todos = getTodos();

  if (!params.id) throw new Error("Expected params.id");
  let todo = todos[params.id];

  if (!todo) throw new Error(`Uh oh, I couldn't find a todo with id "${params.id}"`);
  return todo;
}

export const TodoListScenario = {
  args: {
    routePath: '/todos',
    loader: todoListLoader,
    action: todoListAction,
    outlet: {
      path: ':id',
      element: <Todo />,
      loader: todoLoader,
    },
    children: <TodosList />,
  }
}