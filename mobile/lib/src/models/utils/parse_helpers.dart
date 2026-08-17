String? parseNullableString(Map? json, String key) {
  final value = json?[key];
  if (value == null) return null;
  if (value is String) return value;
  throw ArgumentError.value(value, key, 'Deve ser String ou Null');
}

int? parseNullableInt(Map? json, String key) {
  final value = json?[key];
  if (value == null) return null;
  final parse = int.tryParse('$value');
  if (parse != null) return parse;
  throw ArgumentError.value(
    value,
    key,
    'Deve ser Int, uma String numérica ou Null',
  );
}

double? parseNullableDouble(Map? json, String key) {
  final value = json?[key];
  if (value == null) return null;
  final parse = double.tryParse('$value');
  if (parse != null) return parse;
  throw ArgumentError.value(
    value,
    key,
    'Deve ser Double, uma String numérica ou Null',
  );
}

bool? parseNullableBool(Map? json, String key) {
  final value = json?[key];
  if (value == null) return null;
  if (value is bool) return value;
  if (value == 'true' || value == '1' || value == 1) return true;
  if (value == 'false' || value == '0' || value == 0) return false;
  throw ArgumentError.value(value, key, 'Deve ser Bool ou Null');
}

List<T>? parseNullableList<T>(
  Map? json,
  String key,
  T Function(Map item) fromJson,
) {
  final value = json?[key];
  if (value == null) return null;
  if (value is List) {
    return value.map((item) => fromJson(Map.from(item))).toList();
  }
  throw ArgumentError.value(value, key, 'Deve ser List ou Null');
}

T? parseNullableObject<T>(
  Map? json,
  String key,
  T Function(Map item) fromJson,
) {
  final value = json?[key];
  if (value == null) return null;
  if (value is Map) {
    return fromJson(value);
  }
  throw ArgumentError.value(value, key, 'Deve ser Map/Object ou Null');
}

T parseRequiredObject<T>(Map? json, String key, T Function(Map item) fromJson) {
  final value = json?[key];
  if (value is Map) {
    return fromJson(value);
  }
  throw ArgumentError.value(value, key, 'Deve ser Map/Object e não nulo');
}
