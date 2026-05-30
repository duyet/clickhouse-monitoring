{{/*
Expand the name of the chart.
*/}}
{{- define "clickhouse-monitoring.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this
(by the DNS naming spec). If release name contains chart name it will be used as
a full name.
*/}}
{{- define "clickhouse-monitoring.fullname" -}}
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
{{- define "clickhouse-monitoring.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "clickhouse-monitoring.labels" -}}
helm.sh/chart: {{ include "clickhouse-monitoring.chart" . }}
{{ include "clickhouse-monitoring.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "clickhouse-monitoring.selectorLabels" -}}
app.kubernetes.io/name: {{ include "clickhouse-monitoring.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use.
*/}}
{{- define "clickhouse-monitoring.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "clickhouse-monitoring.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
The container image reference. Falls back to the chart appVersion when
image.tag is empty.
*/}}
{{- define "clickhouse-monitoring.image" -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- printf "%s:%s" .Values.image.repository $tag -}}
{{- end }}

{{/*
The name of the Secret holding the ClickHouse password. Uses an existing Secret
when provided, otherwise the chart-managed one.
*/}}
{{- define "clickhouse-monitoring.secretName" -}}
{{- if .Values.clickhouse.existingSecret }}
{{- .Values.clickhouse.existingSecret }}
{{- else }}
{{- include "clickhouse-monitoring.fullname" . }}
{{- end }}
{{- end }}
