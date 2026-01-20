{{/*
BabyNest Helm Chart Helper Templates
Requirements: 15.2 (Kubernetes deployment with Helm charts)
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "babynest.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "babynest.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "babynest.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "babynest.labels" -}}
helm.sh/chart: {{ include "babynest.chart" . }}
{{ include "babynest.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "babynest.selectorLabels" -}}
app.kubernetes.io/name: {{ include "babynest.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "babynest.serviceAccountName" -}}
{{- if .Values.api.serviceAccount.create }}
{{- default (include "babynest.fullname" .) .Values.api.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.api.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
API component labels
*/}}
{{- define "babynest.api.labels" -}}
{{ include "babynest.labels" . }}
app.kubernetes.io/component: api
{{- end }}

{{/*
API selector labels
*/}}
{{- define "babynest.api.selectorLabels" -}}
{{ include "babynest.selectorLabels" . }}
app.kubernetes.io/component: api
{{- end }}

{{/*
Ollama component labels
*/}}
{{- define "babynest.ollama.labels" -}}
{{ include "babynest.labels" . }}
app.kubernetes.io/component: ollama
{{- end }}

{{/*
Ollama selector labels
*/}}
{{- define "babynest.ollama.selectorLabels" -}}
{{ include "babynest.selectorLabels" . }}
app.kubernetes.io/component: ollama
{{- end }}

{{/*
Get PostgreSQL host
*/}}
{{- define "babynest.postgresql.host" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "babynest.fullname" .) }}
{{- else }}
{{- .Values.postgresql.external.host }}
{{- end }}
{{- end }}

{{/*
Get PostgreSQL port
*/}}
{{- define "babynest.postgresql.port" -}}
{{- if .Values.postgresql.enabled }}
{{- 5432 }}
{{- else }}
{{- .Values.postgresql.external.port }}
{{- end }}
{{- end }}

{{/*
Get PostgreSQL database
*/}}
{{- define "babynest.postgresql.database" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.postgresql.external.database }}
{{- end }}
{{- end }}

{{/*
Get PostgreSQL username
*/}}
{{- define "babynest.postgresql.username" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.username }}
{{- else }}
{{- .Values.postgresql.external.username }}
{{- end }}
{{- end }}

{{/*
Get PostgreSQL secret name
*/}}
{{- define "babynest.postgresql.secretName" -}}
{{- if .Values.postgresql.enabled }}
{{- if .Values.postgresql.auth.existingSecret }}
{{- .Values.postgresql.auth.existingSecret }}
{{- else }}
{{- printf "%s-postgresql" (include "babynest.fullname" .) }}
{{- end }}
{{- else }}
{{- .Values.postgresql.external.existingSecret }}
{{- end }}
{{- end }}

{{/*
Get PostgreSQL secret key
*/}}
{{- define "babynest.postgresql.secretKey" -}}
{{- if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.secretKeys.userPasswordKey | default "password" }}
{{- else }}
{{- .Values.postgresql.external.existingSecretPasswordKey | default "password" }}
{{- end }}
{{- end }}

{{/*
Get Redis host
*/}}
{{- define "babynest.redis.host" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s-redis-master" (include "babynest.fullname" .) }}
{{- else }}
{{- .Values.redis.external.host }}
{{- end }}
{{- end }}

{{/*
Get Redis port
*/}}
{{- define "babynest.redis.port" -}}
{{- if .Values.redis.enabled }}
{{- 6379 }}
{{- else }}
{{- .Values.redis.external.port }}
{{- end }}
{{- end }}

{{/*
Get Redis secret name (if auth enabled)
*/}}
{{- define "babynest.redis.secretName" -}}
{{- if .Values.redis.enabled }}
{{- if .Values.redis.auth.existingSecret }}
{{- .Values.redis.auth.existingSecret }}
{{- else }}
{{- printf "%s-redis" (include "babynest.fullname" .) }}
{{- end }}
{{- else }}
{{- .Values.redis.external.existingSecret }}
{{- end }}
{{- end }}

{{/*
Get Ollama URL
*/}}
{{- define "babynest.ollama.url" -}}
{{- if .Values.ollama.enabled }}
{{- printf "http://%s-ollama:%d" (include "babynest.fullname" .) (int .Values.ollama.service.port) }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Get JWT secret name
*/}}
{{- define "babynest.jwt.secretName" -}}
{{- if .Values.secrets.jwt.existingSecret }}
{{- .Values.secrets.jwt.existingSecret }}
{{- else }}
{{- printf "%s-jwt" (include "babynest.fullname" .) }}
{{- end }}
{{- end }}
