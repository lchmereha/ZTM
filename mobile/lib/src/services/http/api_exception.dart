import 'dart:convert';

/// Represents a single field-level error detail from the backend.
///
/// Matches the backend schema:
/// ```json
/// { "campo": "nome_do_campo", "erros": ["Mensagem 1"], "index": 0 }
/// ```
class ErrorDetail {
  final String campo;
  final List<String> erros;
  final int? index;

  const ErrorDetail({required this.campo, required this.erros, this.index});

  factory ErrorDetail.fromJson(Map<String, dynamic> json) {
    return ErrorDetail(
      campo: json['campo'] as String? ?? '',
      erros: List<String>.from(json['erros'] ?? []),
      index: json['index'] as int?,
    );
  }
}

/// Structured HTTP exception parsed from the backend's standard error format.
///
/// Backend schema:
/// ```json
/// {
///   "statusCode": 400,
///   "error": "Bad Request",
///   "message": "Descrição legível do erro.",
///   "detalhes": [{ "campo": "...", "erros": ["..."] }]
/// }
/// ```
///
/// This class is the mobile equivalent of the frontend's `useErrorHandler` hook.
/// The [HttpService] automatically throws this exception for any response with
/// `statusCode >= 400`, centralizing all error handling.
class ApiException implements Exception {
  final int statusCode;
  final String error;
  final String message;
  final List<ErrorDetail>? detalhes;

  const ApiException({
    required this.statusCode,
    required this.error,
    required this.message,
    this.detalhes,
  });

  /// Parses the backend's standard error response body.
  ///
  /// Handles both structured objects and plain-text responses gracefully.
  factory ApiException.fromResponseBody(int statusCode, String responseBody) {
    try {
      final json = jsonDecode(responseBody);

      if (json is Map<String, dynamic>) {
        // Parse message (can be String or List<String>)
        final rawMessage = json['message'];
        final message = rawMessage is List
            ? rawMessage.join(', ')
            : rawMessage?.toString() ??
                  json['error']?.toString() ??
                  'Erro desconhecido';

        // Parse detalhes (can be List<ErrorDetail> or List<String>)
        List<ErrorDetail>? detalhes;
        final rawDetalhes = json['detalhes'];
        if (rawDetalhes is List && rawDetalhes.isNotEmpty) {
          detalhes = rawDetalhes.map((item) {
            if (item is Map<String, dynamic>) {
              return ErrorDetail.fromJson(item);
            }
            // Plain string item → wrap in ErrorDetail
            return ErrorDetail(campo: '', erros: [item.toString()]);
          }).toList();
        }

        return ApiException(
          statusCode: json['statusCode'] as int? ?? statusCode,
          error: json['error']?.toString() ?? _httpErrorLabel(statusCode),
          message: message,
          detalhes: detalhes,
        );
      }
    } catch (_) {
      // JSON parse failed — fall through to generic
    }

    return ApiException(
      statusCode: statusCode,
      error: _httpErrorLabel(statusCode),
      message: responseBody.isNotEmpty ? responseBody : 'Erro $statusCode',
    );
  }

  /// Whether this exception contains structured field-level details.
  bool get hasDetalhes => detalhes != null && detalhes!.isNotEmpty;

  @override
  String toString() => message;

  /// Maps common HTTP status codes to their standard labels.
  static String _httpErrorLabel(int code) {
    switch (code) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Unprocessable Entity';
      case 500:
        return 'Internal Server Error';
      default:
        return 'HTTP Error';
    }
  }
}
