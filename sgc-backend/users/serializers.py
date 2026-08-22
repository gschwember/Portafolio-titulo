from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


def normalize_required_text(value, field_label):
    normalized = str(value).strip()
    if not normalized:
        raise serializers.ValidationError(f'El campo {field_label} es obligatorio.')
    return normalized


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirmation = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('email', 'rut', 'password', 'password_confirmation', 'first_name', 'last_name')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este email.')
        return value.lower()

    def validate_rut(self, value):
        if not value:
            return value

        normalized_value = value.strip()
        if User.objects.filter(rut__iexact=normalized_value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este RUT.')
        return normalized_value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError({'password_confirmation': 'Las contrasenas no coinciden.'})

        attrs['first_name'] = normalize_required_text(attrs.get('first_name', ''), 'nombre')
        attrs['last_name'] = normalize_required_text(attrs.get('last_name', ''), 'apellido')

        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirmation')
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            role=User.Role.RESIDENTE,
            is_active=False,
            **validated_data,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
        user = authenticate(request=self.context.get('request'), email=email, password=password)

        if not user:
            raise serializers.ValidationError('Credenciales invalidas.')
        if not user.is_active:
            raise serializers.ValidationError('Tu cuenta esta en revision y debe ser aprobada.')

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'rut', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirmation = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('email', 'rut', 'first_name', 'last_name', 'role', 'password', 'password_confirmation', 'is_active')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este email.')
        return value.lower()

    def validate_rut(self, value):
        if not value:
            return value

        normalized_value = value.strip()
        if User.objects.filter(rut__iexact=normalized_value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este RUT.')
        return normalized_value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError({'password_confirmation': 'Las contrasenas no coinciden.'})

        attrs['first_name'] = normalize_required_text(attrs.get('first_name', ''), 'nombre')
        attrs['last_name'] = normalize_required_text(attrs.get('last_name', ''), 'apellido')

        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirmation')
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    password_confirmation = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'rut', 'first_name', 'last_name', 'role', 'is_active', 'password', 'password_confirmation')

    def validate_email(self, value):
        queryset = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('Ya existe un usuario con este email.')
        return value.lower()

    def validate_rut(self, value):
        if not value:
            return value

        normalized_value = value.strip()
        queryset = User.objects.filter(rut__iexact=normalized_value).exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('Ya existe un usuario con este RUT.')
        return normalized_value

    def validate(self, attrs):
        password = attrs.get('password')
        password_confirmation = attrs.get('password_confirmation')
        first_name = attrs.get('first_name')
        last_name = attrs.get('last_name')

        if first_name is not None:
            attrs['first_name'] = normalize_required_text(first_name, 'nombre')
        if last_name is not None:
            attrs['last_name'] = normalize_required_text(last_name, 'apellido')

        if password or password_confirmation:
            if password != password_confirmation:
                raise serializers.ValidationError({'password_confirmation': 'Las contrasenas no coinciden.'})
            validate_password(password)

        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        validated_data.pop('password_confirmation', None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class AuthResponseSerializer(serializers.Serializer):
    user = UserSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()

    @staticmethod
    def build_for_user(user):
        refresh = RefreshToken.for_user(user)
        return {
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
