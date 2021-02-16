import { RouteProps } from "react-router-dom";
import Dashboard from "../Pages/Dashboard";
import CategoryList from "../Pages/category/PageList";
import CategoryForm from "../Pages/category/PageForm";
import CastMemberList from "../Pages/cast-member/PageList";
import CastMemberForm from "../Pages/cast-member/PageForm";
import GenreList from "../Pages/genre/PageList";
import GenreForm from "../Pages/genre/PageForm";
import VideoForm from "../Pages/video/PageForm";
import VideoList from "../Pages/video/PageList";
import UploadPage from "../Pages/uploads";

export interface MyRouteProps extends RouteProps {
  name: string;
  label: string;
}

const routes: MyRouteProps[] = [
  {
    name: "dashboard",
    label: "Dashboard",
    path: "/",
    component: Dashboard,
    exact: true,
  },
  {
    name: "categories.list",
    label: "Listar categorias",
    path: "/categories",
    component: CategoryList,
    exact: true,
  },
  {
    name: "categories.create",
    label: "Criar categoria",
    path: "/categories/create",
    component: CategoryForm,
    exact: true,
  },
  {
    name: "categories.edit",
    label: "Editar categoria",
    path: "/categories/:id/edit",
    component: CategoryForm,
    exact: true,
  },
  {
    name: "cast_members.list",
    label: "Listar membros de elencos",
    path: "/cast-members",
    component: CastMemberList,
    exact: true,
  },
  {
    name: "cast_members.create",
    label: "Criar membro de elenco",
    path: "/cast-members/create",
    component: CastMemberForm,
    exact: true,
  },
  {
    name: "cast_members.edit",
    label: "Editar membro de elenco",
    path: "/cast-members/:id/edit",
    component: CastMemberForm,
    exact: true,
  },
  {
    name: "genres.list",
    label: "Listar gêneros",
    path: "/genres",
    component: GenreList,
    exact: true,
  },
  {
    name: "genres.create",
    label: "Criar gêneros",
    path: "/genres/create",
    component: GenreForm,
    exact: true,
  },
  {
    name: "genres.edit",
    label: "Editar gêneros",
    path: "/genres/:id/edit",
    component: GenreForm,
    exact: true,
  },
  {
    name: "videos.list",
    label: "Listar videos",
    path: "/videos",
    component: VideoList,
    exact: true,
  },
  {
    name: "videos.create",
    label: "Criar Videos",
    path: "/videos/create",
    component: VideoForm,
    exact: true,
  },
  {
    name: "videos.edit",
    label: "Editar vídeo",
    path: "/videos/:id/edit",
    component: VideoForm,
    exact: true,
  },
  {
    name: "uploads.list",
    label: "Uploads",
    path: "/uploads",
    component: UploadPage,
    exact: true,
  },
];

export default routes;
