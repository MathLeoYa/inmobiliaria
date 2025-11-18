--
-- PostgreSQL database dump
--

\restrict BfhAzii1CpnyDVP8RQNrfTOgtx9HNbnsQ9c5R6t6Yd2oFmnHLrHsZQjLKGibPlN

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: estado_solicitud_agente; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_solicitud_agente AS ENUM (
    'NO_SOLICITADO',
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO'
);


ALTER TYPE public.estado_solicitud_agente OWNER TO postgres;

--
-- Name: tipo_rol; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_rol AS ENUM (
    'CLIENTE',
    'AGENTE',
    'ADMIN',
    'SUPER_USUARIO'
);


ALTER TYPE public.tipo_rol OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cantones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cantones (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    provincia_id integer NOT NULL
);


ALTER TABLE public.cantones OWNER TO postgres;

--
-- Name: cantones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cantones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cantones_id_seq OWNER TO postgres;

--
-- Name: cantones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cantones_id_seq OWNED BY public.cantones.id;


--
-- Name: configuracion_sistema; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracion_sistema (
    id integer DEFAULT 1 NOT NULL,
    telefono_admin_whatsapp character varying(20)
);


ALTER TABLE public.configuracion_sistema OWNER TO postgres;

--
-- Name: favoritos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favoritos (
    usuario_id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    fecha_agregado timestamp with time zone DEFAULT now()
);


ALTER TABLE public.favoritos OWNER TO postgres;

--
-- Name: fotos_propiedad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fotos_propiedad (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    propiedad_id uuid NOT NULL,
    url_foto character varying(512) NOT NULL,
    orden integer DEFAULT 0
);


ALTER TABLE public.fotos_propiedad OWNER TO postgres;

--
-- Name: propiedades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.propiedades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    propietario_id uuid NOT NULL,
    titulo character varying(255) NOT NULL,
    descripcion text,
    precio numeric(12,2) NOT NULL,
    tipo character varying(50),
    habitaciones integer DEFAULT 0,
    banos integer DEFAULT 0,
    area_m2 integer,
    latitud numeric(9,6) NOT NULL,
    longitud numeric(9,6) NOT NULL,
    direccion_texto character varying(255),
    fecha_publicacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone DEFAULT now(),
    amenidades text[] DEFAULT ARRAY[]::text[],
    provincia character varying(100),
    ciudad character varying(100),
    operacion character varying(20) DEFAULT 'Venta'::character varying
);


ALTER TABLE public.propiedades OWNER TO postgres;

--
-- Name: provincias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provincias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL
);


ALTER TABLE public.provincias OWNER TO postgres;

--
-- Name: provincias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.provincias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.provincias_id_seq OWNER TO postgres;

--
-- Name: provincias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provincias_id_seq OWNED BY public.provincias.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    google_id character varying(255),
    rol public.tipo_rol DEFAULT 'CLIENTE'::public.tipo_rol NOT NULL,
    estado_agente public.estado_solicitud_agente DEFAULT 'NO_SOLICITADO'::public.estado_solicitud_agente NOT NULL,
    mensaje_solicitud_agente text,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone DEFAULT now(),
    telefono character varying(25),
    logo_url character varying(255) DEFAULT NULL::character varying,
    foto_perfil character varying(255),
    biografia text,
    facebook character varying(255),
    instagram character varying(255),
    sitio_web character varying(255),
    ciudad character varying(100),
    provincia character varying(100)
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: cantones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cantones ALTER COLUMN id SET DEFAULT nextval('public.cantones_id_seq'::regclass);


--
-- Name: provincias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias ALTER COLUMN id SET DEFAULT nextval('public.provincias_id_seq'::regclass);


--
-- Data for Name: cantones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cantones (id, nombre, provincia_id) FROM stdin;
1	Cuenca	1
2	Camilo Ponce Enríquez	1
3	Chordeleg	1
4	El Pan	1
5	Girón	1
6	Guachapala	1
7	Gualaceo	1
8	Nabón	1
9	Oña	1
10	Paute	1
11	Pucará	1
12	San Fernando	1
13	Santa Isabel	1
14	Sevilla de Oro	1
15	Sígsig	1
16	Guaranda	2
17	Caluma	2
18	Chillanes	2
19	Chimbo	2
20	Echeandía	2
21	Las Naves	2
22	San Miguel	2
23	Azogues	3
24	Biblián	3
25	Cañar	3
26	Déleg	3
27	El Tambo	3
28	La Troncal	3
29	Suscal	3
30	Tulcán	4
31	Bolívar	4
32	Espejo	4
33	Mira	4
34	Montúfar	4
35	San Pedro de Huaca	4
36	Riobamba	5
37	Alausí	5
38	Chambo	5
39	Chunchi	5
40	Colta	5
41	Cumandá	5
42	Guamote	5
43	Guano	5
44	Pallatanga	5
45	Penipe	5
46	Latacunga	6
47	La Maná	6
48	Pangua	6
49	Pujilí	6
50	Salcedo	6
51	Saquisilí	6
52	Sigchos	6
53	Machala	7
54	Arenillas	7
55	Atahualpa	7
56	Balsas	7
57	Chilla	7
58	El Guabo	7
59	Huaquillas	7
60	Las Lajas	7
61	Marcabelí	7
62	Pasaje	7
63	Piñas	7
64	Portovelo	7
65	Santa Rosa	7
66	Zaruma	7
67	Esmeraldas	8
68	Atacames	8
69	Eloy Alfaro	8
70	Muisne	8
71	Quinindé	8
72	Rioverde	8
73	San Lorenzo	8
74	San Cristóbal	9
75	Isabela	9
76	Santa Cruz	9
77	Guayaquil	10
78	Alfredo Baquerizo Moreno	10
79	Balao	10
80	Balzar	10
81	Colimes	10
82	Daule	10
83	Durán	10
84	El Empalme	10
85	El Triunfo	10
86	General Antonio Elizalde	10
87	Isidro Ayora	10
88	Lomas de Sargentillo	10
89	Marcelino Maridueña	10
90	Milagro	10
91	Naranjal	10
92	Naranjito	10
93	Nobol	10
94	Palestina	10
95	Pedro Carbo	10
96	Playas	10
97	Salitre	10
98	Samborondón	10
99	Santa Lucía	10
100	Simón Bolívar	10
101	Yaguachi	10
102	Ibarra	11
103	Antonio Ante	11
104	Cotacachi	11
105	Otavalo	11
106	Pimampiro	11
107	San Miguel de Urcuquí	11
108	Loja	12
109	Calvas	12
110	Catamayo	12
111	Celica	12
112	Chaguarpamba	12
113	Espíndola	12
114	Gonzanamá	12
115	Macará	12
116	Olmedo	12
117	Paltas	12
118	Pindal	12
119	Puyango	12
120	Quilanga	12
121	Saraguro	12
122	Sozoranga	12
123	Zapotillo	12
124	Babahoyo	13
125	Baba	13
126	Buena Fe	13
127	Mocache	13
128	Montalvo	13
129	Palenque	13
130	Puebloviejo	13
131	Quevedo	13
132	Quinsaloma	13
133	Urdaneta	13
134	Valencia	13
135	Ventanas	13
136	Vinces	13
137	Portoviejo	14
138	Bolívar	14
139	Chone	14
140	El Carmen	14
141	Flavio Alfaro	14
142	Jama	14
143	Jaramijó	14
144	Jipijapa	14
145	Junín	14
146	Manta	14
147	Montecristi	14
148	Olmedo	14
149	Paján	14
150	Pedernales	14
151	Pichincha	14
152	Puerto López	14
153	Rocafuerte	14
154	San Vicente	14
155	Santa Ana	14
156	Sucre	14
157	Tosagua	14
158	24 de Mayo	14
159	Morona	15
160	Gualaquiza	15
161	Huamboya	15
162	Limón Indanza	15
163	Logroño	15
164	Palora	15
165	San Juan Bosco	15
166	Santiago	15
167	Sucúa	15
168	Taisha	15
169	Tiwintza	15
170	Tena	16
171	Archidona	16
172	Carlos Julio Arosemena Tola	16
173	El Chaco	16
174	Quijos	16
175	Francisco de Orellana	17
176	Aguarico	17
177	La Joya de los Sachas	17
178	Loreto	17
179	Puyo	18
180	Arajuno	18
181	Mera	18
182	Santa Clara	18
183	Quito	19
184	Cayambe	19
185	Mejía	19
186	Pedro Moncayo	19
187	Pedro Vicente Maldonado	19
188	Puerto Quito	19
189	Rumiñahui	19
190	Santa Elena	20
191	La Libertad	20
192	Salinas	20
193	Santo Domingo	21
194	La Concordia	21
195	Nueva Loja	22
196	Cascales	22
197	Cuyabeno	22
198	Gonzalo Pizarro	22
199	Lago Agrio	22
200	Putumayo	22
201	Shushufindi	22
202	Sucumbíos	22
203	Ambato	23
204	Baños de Agua Santa	23
205	Cevallos	23
206	Mocha	23
207	Patate	23
208	Pelileo	23
209	Píllaro	23
210	Quero	23
211	Tisaleo	23
212	Zamora	24
213	Chinchipe	24
214	El Pangui	24
215	Nangaritza	24
216	Palanda	24
217	Paquisha	24
218	Yacuambi	24
219	Yantzaza	24
220	Zamora	24
\.


--
-- Data for Name: configuracion_sistema; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracion_sistema (id, telefono_admin_whatsapp) FROM stdin;
1	996347303
\.


--
-- Data for Name: favoritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favoritos (usuario_id, propiedad_id, fecha_agregado) FROM stdin;
561252e0-2e89-45a3-a3b1-c8ca69e2b7b9	9dd45cba-9e35-4f2e-813d-95af31e31bd6	2025-11-16 18:21:13.743081-05
1951b9f0-427c-472d-80ac-a46a6d76602e	6cab7f33-1b71-4fa3-a812-1521de56deec	2025-11-17 16:49:10.350701-05
1951b9f0-427c-472d-80ac-a46a6d76602e	de53b2f7-0a78-40f9-8620-9454df9de8c8	2025-11-17 17:06:28.405913-05
1951b9f0-427c-472d-80ac-a46a6d76602e	123a02a1-a8af-4cdd-a131-5ebb5956bd51	2025-11-17 17:06:29.525482-05
1951b9f0-427c-472d-80ac-a46a6d76602e	9b32c654-5b45-4831-8c9d-cc9e7999647f	2025-11-17 17:06:33.822547-05
\.


--
-- Data for Name: fotos_propiedad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fotos_propiedad (id, propiedad_id, url_foto, orden) FROM stdin;
933eff6a-6cb5-44b6-abc7-84c783117117	9dd45cba-9e35-4f2e-813d-95af31e31bd6	https://res.cloudinary.com/dpce2onkx/image/upload/v1763309297/inmobiliaria/propiedades/tokcdlkn4kdy6becyqes.jpg	0
57fd984a-4b8f-4a0d-8e9c-544fd4111ceb	9b32c654-5b45-4831-8c9d-cc9e7999647f	https://res.cloudinary.com/dpce2onkx/image/upload/v1763405519/inmobiliaria/propiedades/ygrsul7a3u8vwvkjzcgd.jpg	0
ec98042c-db85-4e6d-8f2c-596454dd0992	123a02a1-a8af-4cdd-a131-5ebb5956bd51	https://res.cloudinary.com/dpce2onkx/image/upload/v1763405583/inmobiliaria/propiedades/qf7leygutltjoyfcjecm.jpg	0
be949a18-273a-420b-82c0-ad4b83d494c5	6cab7f33-1b71-4fa3-a812-1521de56deec	https://res.cloudinary.com/dpce2onkx/image/upload/v1763405703/inmobiliaria/propiedades/xycrbvoznt9d6k757buy.jpg	0
eb4e598e-d4c1-40ca-9637-aae637b597d6	de53b2f7-0a78-40f9-8620-9454df9de8c8	https://res.cloudinary.com/dpce2onkx/image/upload/v1763411599/inmobiliaria/propiedades/bbk47vkj60ekgwxjtuop.jpg	0
9c993109-7be4-40ab-9271-88812eb034c1	de53b2f7-0a78-40f9-8620-9454df9de8c8	https://res.cloudinary.com/dpce2onkx/image/upload/v1763411596/inmobiliaria/propiedades/br45m9ucwfjiusrkzdw1.jpg	1
4408e1a0-35c7-4e7c-a79a-1e8d590fe11d	de53b2f7-0a78-40f9-8620-9454df9de8c8	https://res.cloudinary.com/dpce2onkx/image/upload/v1763411595/inmobiliaria/propiedades/fpgyqk5sn26gb4qdztre.jpg	2
0dbfe5cd-9e40-492c-baea-95e9af06910a	de53b2f7-0a78-40f9-8620-9454df9de8c8	https://res.cloudinary.com/dpce2onkx/image/upload/v1763411596/inmobiliaria/propiedades/l7xyyatiaheklrznksqf.jpg	3
5deffefb-7f7d-41f2-a379-21bb433d8606	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417279/inmobiliaria/propiedades/upmb0owirms1fsxzr5cq.jpg	0
cefc8528-c782-4d12-ad2b-3553df9c58f5	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417279/inmobiliaria/propiedades/kjv7uwlynlq2rciyggvk.jpg	1
db75d41f-837f-4bde-9d5a-81d9b5c641c3	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417280/inmobiliaria/propiedades/cycvd0f993ps34qren4h.jpg	2
18dba464-7366-43bc-8924-ff012a7944c0	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417279/inmobiliaria/propiedades/ohlalouuob0rdwowynpi.jpg	3
bb7e9738-2418-4305-8b0b-5615d98a1f9e	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417279/inmobiliaria/propiedades/qfuyeyydmwprlcflmvzg.jpg	4
c5fbbb5b-31a0-4701-83b8-69e131d5a4a4	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417279/inmobiliaria/propiedades/ho0irozhotkphlvdefee.jpg	5
1667e89c-d5a1-4731-84df-068333bb60e1	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417283/inmobiliaria/propiedades/t2fbjddel6ahrqd0jeqg.jpg	6
f4a4c814-ced5-4ec9-b5c0-0b6dd94a7633	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417281/inmobiliaria/propiedades/qwxi4bit9ygh73kzog4f.jpg	7
295b528d-7a6b-4b67-877b-3434255cf2dd	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417281/inmobiliaria/propiedades/lvrzdzn2gctyj3x94kj4.jpg	8
1285aaaa-cc5e-4de0-a62f-0dd48e5df092	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417281/inmobiliaria/propiedades/tilq2tqrubd6tva1pas5.jpg	9
4a7e9c8f-0d82-4f3a-843a-43454f209b39	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417281/inmobiliaria/propiedades/nzuzxmpjziw1hua5znsb.jpg	10
38bffe71-4a9b-4068-b28b-5034bf5894f0	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417281/inmobiliaria/propiedades/hzprbrydegd8fl4nivwa.jpg	11
92396d13-3fee-45d5-a471-e6f0a9a5ea1d	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417281/inmobiliaria/propiedades/pskalascjijuhuq4ulb9.jpg	12
9d3d236f-ed92-4a6c-b02d-4609f4653e7d	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417281/inmobiliaria/propiedades/l8tai8jmga4v4wm75ctz.jpg	13
8a495c63-99a6-4b1e-9ee6-47677cb57ed3	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417282/inmobiliaria/propiedades/tydc6baencdexik9g5gd.jpg	14
ce5c483e-f39e-43c7-8bb2-ba8975def3ea	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417282/inmobiliaria/propiedades/c51jfpgtwq4zbm6d5cj8.jpg	15
b44f39ab-15bf-4931-be18-ce5b59e988a5	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417282/inmobiliaria/propiedades/ozxfu63g2msj5gkvkmls.jpg	16
0b58bddf-39c9-4f6f-8876-56bfdcd8721b	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417282/inmobiliaria/propiedades/qlxldc1aw7qiltwb4m48.jpg	17
8a08e180-b99f-451c-bd1a-bb119438c098	9283044b-f261-4e30-b5fc-e3b11aa69c24	https://res.cloudinary.com/dpce2onkx/image/upload/v1763417282/inmobiliaria/propiedades/um42mukl0aigiht9xkkm.jpg	18
\.


--
-- Data for Name: propiedades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.propiedades (id, propietario_id, titulo, descripcion, precio, tipo, habitaciones, banos, area_m2, latitud, longitud, direccion_texto, fecha_publicacion, fecha_actualizacion, amenidades, provincia, ciudad, operacion) FROM stdin;
9dd45cba-9e35-4f2e-813d-95af31e31bd6	1951b9f0-427c-472d-80ac-a46a6d76602e	Casa Moderna	Casa amplia con buena vista	27999.00	Casa	3	4	150	-3.990385	-79.208459	Ubicación actual	2025-11-16 11:08:18.303259-05	2025-11-16 11:09:34.084428-05	{}	\N	\N	Venta
9b32c654-5b45-4831-8c9d-cc9e7999647f	39ce47b0-40a3-46c5-9b77-0ed7cea9f2c6	Casa 1	Casa 1	100000.00	Casa	4	6	200	-4.015238	-79.220438	calle 1 y calle 2	2025-11-17 13:52:00.996753-05	2025-11-17 13:52:00.996753-05	{}	Azuay	Cuenca	Venta
123a02a1-a8af-4cdd-a131-5ebb5956bd51	39ce47b0-40a3-46c5-9b77-0ed7cea9f2c6	Departamento 1	Departamento 1	10000.00	Apartamento	2	2	19	-4.006810	-79.198444		2025-11-17 13:53:04.108665-05	2025-11-17 13:53:04.108665-05	{}	Bolívar	Caluma	Venta
6cab7f33-1b71-4fa3-a812-1521de56deec	1951b9f0-427c-472d-80ac-a46a6d76602e	Terreno 1	Terreno	10000.00	Terreno	\N	\N	\N	-4.008000	-79.204500		2025-11-17 13:55:03.904865-05	2025-11-17 13:55:03.904865-05	{}	Guayas	Colimes	Venta
de53b2f7-0a78-40f9-8620-9454df9de8c8	1951b9f0-427c-472d-80ac-a46a6d76602e	Casa 2	casa 2	50.00	Casa	1	2	200	-4.010636	-79.201920		2025-11-17 15:33:20.601712-05	2025-11-17 15:33:20.601712-05	{}	Loja	Loja	Arriendo
9283044b-f261-4e30-b5fc-e3b11aa69c24	1951b9f0-427c-472d-80ac-a46a6d76602e	Departamento 2	Departamento 2	70000.00	Departamento	6	4	149	-4.010080	-79.207089		2025-11-17 17:08:04.708761-05	2025-11-17 17:08:04.708761-05	{}	Galápagos	Santa Cruz	Venta
\.


--
-- Data for Name: provincias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provincias (id, nombre) FROM stdin;
1	Azuay
2	Bolívar
3	Cañar
4	Carchi
5	Chimborazo
6	Cotopaxi
7	El Oro
8	Esmeraldas
9	Galápagos
10	Guayas
11	Imbabura
12	Loja
13	Los Ríos
14	Manabí
15	Morona Santiago
16	Napo
17	Orellana
18	Pastaza
19	Pichincha
20	Santa Elena
21	Santo Domingo de los Tsáchilas
22	Sucumbíos
23	Tungurahua
24	Zamora Chinchipe
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, email, password_hash, google_id, rol, estado_agente, mensaje_solicitud_agente, fecha_creacion, fecha_actualizacion, telefono, logo_url, foto_perfil, biografia, facebook, instagram, sitio_web, ciudad, provincia) FROM stdin;
39ce47b0-40a3-46c5-9b77-0ed7cea9f2c6	Usuario de Prueba	prueba@test.com	$2b$10$H5gnHUeoQ/ekHZJa9rfRf.9XF338GtYuCmgXPjLkIEq6BNY8A6Mti	\N	ADMIN	NO_SOLICITADO	\N	2025-11-15 15:34:10.34124-05	2025-11-15 15:34:10.34124-05	\N	\N	\N	\N	\N	\N	\N	\N	\N
561252e0-2e89-45a3-a3b1-c8ca69e2b7b9	Usuario de Prueba 4	prueba@test4.com	$2b$10$nbBtBOw/HwtJ.u5FjNoTvezGCcBGPFBMFvRHxe7Plo9FvIofKYf3y	\N	CLIENTE	PENDIENTE	\N	2025-11-15 17:31:22.726207-05	2025-11-15 17:37:44.979273-05	\N	\N	\N	\N	\N	\N	\N	\N	\N
e0c7ffed-cc07-4c75-8c48-c53aca5e66dc	Usuario de Prueba 3	prueba@test3.com	$2b$10$8iUVDeZriwiluE49FCPyke8qXo0mOMc6sVKdNkETdhfiUFrFKDUQS	\N	AGENTE	APROBADO	\N	2025-11-15 17:14:01.144147-05	2025-11-15 17:45:41.012519-05	\N	\N	\N	\N	\N	\N	\N	\N	\N
76e51dc4-c426-4531-b37f-06d554e6754d	aaa	aaa@gmail.com	$2b$10$4p2evfUnwvaqNdZE9xCEoOdo7LTIcogjehhQmV1nkgxqi9rmPbNTi	\N	AGENTE	APROBADO	\N	2025-11-15 18:59:30.079542-05	2025-11-16 00:04:08.508449-05	\N	\N	\N	\N	\N	\N	\N	\N	\N
1951b9f0-427c-472d-80ac-a46a6d76602e	Usuario de Prueba 2	prueba@test2.com	$2b$10$JqBpB/QjDPmQ2uufeEqWa.LGrgTqTt.lHC1g3hVmDZSFvB15UqVoe	\N	AGENTE	NO_SOLICITADO	\N	2025-11-15 16:47:08.752084-05	2025-11-15 16:47:08.752084-05	996771757	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Name: cantones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cantones_id_seq', 220, true);


--
-- Name: provincias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provincias_id_seq', 24, true);


--
-- Name: cantones cantones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cantones
    ADD CONSTRAINT cantones_pkey PRIMARY KEY (id);


--
-- Name: configuracion_sistema configuracion_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_sistema
    ADD CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (id);


--
-- Name: favoritos favoritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_pkey PRIMARY KEY (usuario_id, propiedad_id);


--
-- Name: fotos_propiedad fotos_propiedad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fotos_propiedad
    ADD CONSTRAINT fotos_propiedad_pkey PRIMARY KEY (id);


--
-- Name: propiedades propiedades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_pkey PRIMARY KEY (id);


--
-- Name: provincias provincias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_google_id_key UNIQUE (google_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: cantones cantones_provincia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cantones
    ADD CONSTRAINT cantones_provincia_id_fkey FOREIGN KEY (provincia_id) REFERENCES public.provincias(id);


--
-- Name: favoritos favoritos_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: favoritos favoritos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: fotos_propiedad fotos_propiedad_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fotos_propiedad
    ADD CONSTRAINT fotos_propiedad_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: propiedades propiedades_propietario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_propietario_id_fkey FOREIGN KEY (propietario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict BfhAzii1CpnyDVP8RQNrfTOgtx9HNbnsQ9c5R6t6Yd2oFmnHLrHsZQjLKGibPlN

